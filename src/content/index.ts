import { mount, waitMountApp } from "./ui"
import { contentCss, pipLauncher, pipLoading, pipWindow } from "@/store"
import { MessageType } from "@/types"
import Copilot from "./Copilot.vue"
import { waitMessage } from "@/utils/ext"
import {
  dispatchContentEvent,
  addContentEventListener,
  removeContentEventListener,
} from "@/content/event"
// import { PipEventName } from "@/types/pip"

function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (res: any) => void
) {
  console.log(message, sender)
  switch (message?.type) {
    case MessageType.pip:
      dispatchContentEvent({
        type: "pip",
        detail: message.options,
      })
      break
    case "content-css":
      contentCss.value = message.payload?.value || ""
      break
    case MessageType.pipLaunch:
      pipLauncher.visible = true
      break
    case MessageType.hiContent:
      chrome.runtime.sendMessage({
        type: MessageType.contentHere,
      })
      sendResponse({ type: MessageType.contentHere })
      break
    case MessageType.pipWinInfo:
      pipWindow.windowsWindow = message.window
      chrome.storage.local.set({
        pipWindowId: message.window.id,
      })
      break
  }
}

async function handlePipEvent(event: any) {
  const win = await new Promise<Window | null>((r) => {
    const docPip = window.documentPictureInPicture
    const handleEnter = () => {
      r(docPip.window)
      docPip?.removeEventListener("enter", handleEnter)
    }
    docPip?.addEventListener("enter", handleEnter)
  })

  console.log("content pip event: ", event)

  if (win) {
    pipWindow.window = win
    mount(Copilot, win.document)

    await new Promise<void>((r) => {
      const handlePipLoaded = (e: Event) => {
        console.log("load", e)
        r()
        removeContentEventListener("loaded", handlePipLoaded)
      }
      addContentEventListener("loaded", handlePipLoaded)
    })

    // may be 0 if not wait document is loaded
    chrome.runtime.sendMessage({
      type: MessageType.getPipWinInfo,
      options: {
        width: win.outerWidth,
        height: win.outerHeight,
      },
    })

    win.addEventListener("pagehide", () => {
      chrome.storage.local.set({
        pipWindowId: 0,
      })
    })
  }
}

async function handlePipLoadedEvent(e: Event) {
  console.log("e: ", e)
  pipLoading.splashScreen = false
  pipLoading.isLoading = false
  const win = window.documentPictureInPicture.window
  if (win) {
    mount(Copilot, win.document)
  }
}

async function handlePopLoadDocEvent(e: CustomEvent | Event) {
  pipLoading.isLoading = true
}

chrome.runtime?.onMessage.addListener(handleMessage)
addContentEventListener("pip", handlePipEvent)
addContentEventListener("loaded", handlePipLoadedEvent)
addContentEventListener("load-doc", handlePopLoadDocEvent)
waitMountApp()

// dev
if (location.host == chrome.runtime.id && location.hash == "#copilot") {
  mount(Copilot, window.document)
}
