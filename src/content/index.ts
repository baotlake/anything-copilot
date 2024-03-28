import { mount, waitMountApp } from "./ui"
import {
  chatDocsPanel,
  pipLauncher,
  pipLoading,
  pipWindow,
  sidebarAddon,
} from "@/store/content"
import { ContentEventType, FrameMessageType, MessageType } from "@/types"
import Copilot from "./Copilot.vue"
import { waitMessage } from "@/utils/ext"
import {
  dispatchContentEvent,
  addContentEventListener,
  removeContentEventListener,
} from "@/content/event"
import { contentService } from "@/utils/service"
import { getPageIcon } from "@/utils/dom"
// import { PipEventName } from "@/types/pip"

function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (res: any) => void
) {
  console.log("[Content]", message.type, message, sender)
  switch (message?.type) {
    case MessageType.pip:
      dispatchContentEvent({
        type: ContentEventType.pip,
        detail: message.options,
      })
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
    case MessageType.invokeResponse:
      contentService.handleMessage(message)
      break
    case MessageType.showChatDocs:
      chatDocsPanel.visible = true
      break
    case MessageType.openContentSidebar:
      sidebarAddon.visible = true
      sidebarAddon.hidden = false
      sidebarAddon.url = message.url
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
        removeContentEventListener(ContentEventType.pipLoaded, handlePipLoaded)
      }
      addContentEventListener(ContentEventType.pipLoaded, handlePipLoaded)
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

function run() {
  chrome.runtime?.onMessage.addListener(handleMessage)
  addContentEventListener(ContentEventType.pip, handlePipEvent)
  addContentEventListener(ContentEventType.pipLoaded, handlePipLoadedEvent)
  addContentEventListener(ContentEventType.pipLoad, handlePopLoadDocEvent)
  waitMountApp()
}

async function postPageInfo() {
  await new Promise((r) => setTimeout(r, 200))
  window.parent?.postMessage(
    {
      type: FrameMessageType.pageInfo,
      url: location.href,
      title: document.title || location.host,
      icon: getPageIcon(),
    },
    chrome.runtime.getURL("")
  )
}

function handleFrameMessage(e: MessageEvent) {
  if (!e.data || typeof e.data !== "object") return
  const type = e.data.type
  switch (type) {
    case FrameMessageType.webviewRun:
      run()
      postPageInfo()
      return
    case FrameMessageType.escapeLoad:
      return dispatchContentEvent({
        type: ContentEventType.escapeLoad,
        detail: { url: e.data.url },
      })
    case FrameMessageType.reload:
      return location.reload()
    case FrameMessageType.goBack:
      return history.back()
    case FrameMessageType.goForward:
      return history.forward()
  }
}

if (window.self == window.parent) {
  run()
} else {
  window.addEventListener("message", handleFrameMessage)
  window.parent?.postMessage(
    {
      type: FrameMessageType.frameReady,
      url: location.href,
    },
    chrome.runtime.getURL("")
  )
}

// dev
if (location.host == chrome.runtime.id && location.hash == "#copilot") {
  mount(Copilot, window.document)
}
