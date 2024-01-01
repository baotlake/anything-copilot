import { MessageType, ServiceFunc, type ParseDocOptions } from "@/types"

let creating: Promise<void> | null // A global promise to avoid concurrency issues

export async function setupOffscreenDocument(path: string) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path)
  const existingContexts = await (chrome.runtime as any).getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  })

  if (existingContexts.length > 0) {
    return
  }

  // create offscreen document
  if (creating) {
    await creating
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: [
        chrome.offscreen.Reason.BLOBS,
        chrome.offscreen.Reason.WORKERS,
        chrome.offscreen.Reason.DOM_PARSER,
        // chrome.offscreen.Reason.DOM_SCRAPING,
        // chrome.offscreen.Reason.IFRAME_SCRIPTING,
      ],
      justification: "reason for needing the document",
    })
    await creating
    creating = null
  }
}

export const offscreenHtmlPath = "/src/pages/offscreen.html"

class Offscreen {
  public readonly path: string

  private pendingCallback: {
    [key in string]: { resolve: (v: any) => void; reject: (e: any) => void }
  }

  constructor(path: string) {
    this.path = path
    this.pendingCallback = {}
  }

  public setup() {
    return setupOffscreenDocument(this.path)
  }

  public handleOffscreenMessage(message: any) {
    const { type, key, payload, success } = message
    if (type === MessageType.fromOffscreen) {
      const callbacks = this.pendingCallback[key]
      if (callbacks) {
        const callback = success != false ? callbacks.resolve : callbacks.reject
        callback(payload)
      }
      delete this.pendingCallback[key]
    }
  }

  private getReturnValue(key: string) {
    const promise = new Promise((resolve, reject) => {
      this.pendingCallback[key] = { resolve, reject }
    })
    return promise
  }

  private async executeTask(task: string, payload: any) {
    await this.setup()
    const key = crypto.randomUUID()
    chrome.runtime.sendMessage({
      type: MessageType.toOffscreen,
      key,
      task,
      payload,
    })

    return key
  }

  public async parseDoc(options: ParseDocOptions) {
    console.log("to offscreen parseDoc ", options)
    const key = await this.executeTask(ServiceFunc.parseDoc, options)
    return this.getReturnValue(key)
  }
}

export const offscreen = new Offscreen(offscreenHtmlPath)
