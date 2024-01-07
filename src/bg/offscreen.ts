import { MessageType, ServiceFunc, type ParseDocOptions } from "@/types"
import Invoke from "@/utils/Invoke"

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

class Offscreen extends Invoke {
  public readonly path: string

  constructor(path: string) {
    super("offscreen")
    this.path = path
  }

  public async send(req: any): Promise<{ key: string; response: any }> {
    const key = this.key
    await this.setup()
    
    const response = await chrome.runtime.sendMessage({
      type: MessageType.toOffscreen,
      key,
      ...req,
    })
    return { key, response }
  }

  public handleMessage(message: any): void {
    const { type, key, payload, success } = message
    if (type === MessageType.fromOffscreen) {
      this.setReturnValue(key, success, payload)
    }
  }

  public setup() {
    return setupOffscreenDocument(this.path)
  }
}

export const offscreen = new Offscreen(offscreenHtmlPath)
