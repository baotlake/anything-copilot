import { ServiceFunc } from "@/types"
import { messageInvoke } from "@/utils/invoke"

let creating: Promise<void> | null // A global promise to avoid concurrency issues

export async function createOffscreenDocument(path: string) {
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

export const offscreenHtmlPath = "/offscreen.html"

export async function setupOffscreen() {
  await createOffscreenDocument(offscreenHtmlPath)
  await messageInvoke.invoke({
    key: ServiceFunc.waitOffscreen,
    func: ServiceFunc.waitOffscreen,
    args: [],
  })
}
