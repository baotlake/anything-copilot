import {
  MessageType,
  ServiceFunc,
  type ParseDocOptions,
  ContentScriptId,
} from "@/types"
import { waitMessage, tabUpdated, getLocal, getPipWindow } from "@/utils/ext"
import { setupOffscreenDocument, offscreenHtmlPath } from "./offscreen"
import {
  registerContentSidebar,
  unregisterContentSidebar,
  handleContentMounted,
} from "./sidebar"
import config from "@/assets/config.json"
import { allFrameScript, contentMainScript } from "@/manifest"
import { getIsEdge } from "@/utils/ext"
import { contentInvoke } from "@/utils/invoke"

type Config = typeof config

const manifest = chrome.runtime.getManifest()
const placeholder = manifest.content_scripts![0]
const isEdge = getIsEdge()

const contentScript = {
  id: ContentScriptId.content,
  matches: ["<all_urls>"],
  js: placeholder.js,
  runAt: placeholder.run_at as "document_start",
} satisfies chrome.scripting.RegisteredContentScript

chrome.scripting.registerContentScripts([contentScript, contentMainScript])
chrome.runtime.onMessage.addListener(handleMessage)
chrome.commands.onCommand.addListener(handleCommand)
chrome.runtime.onStartup.addListener(() => {
  updateConfig()
})

if (isEdge) {
  chrome.sidePanel.setOptions({
    enabled: false,
  })
}

async function openPipBackground(url: string) {
  const tab = await chrome.tabs.create({
    url: url,
  })

  await tabUpdated({ tabId: tab.id!, status: "complete" })

  chrome.tabs.sendMessage(tab.id!, {
    type: "pip",
    options: {
      url: url,
      mode: "write-html",
    },
  })
}

async function pipLaunch(url: string) {
  const tab = await chrome.tabs.create({ url })
  await waitMessage({
    tabId: tab.id!,
    type: MessageType.contentMounted,
  })
  chrome.tabs.sendMessage(tab.id!, {
    type: MessageType.pipLaunch,
    url: url,
  })
}

type UpdatePipWinOption = {
  windowId: number
  windowInfo: Partial<chrome.windows.UpdateInfo>
}

async function updateWindow({ windowId, windowInfo }: UpdatePipWinOption) {
  await chrome.windows.update(windowId, windowInfo)
}

let currentSender: chrome.runtime.MessageSender | null = null

contentInvoke
  .register(ServiceFunc.setupOffscreen, () =>
    setupOffscreenDocument(offscreenHtmlPath)
  )
  .register(ServiceFunc.getAllCommands, () => chrome.commands.getAll())
  .register(ServiceFunc.createTab, (p: chrome.tabs.CreateProperties) =>
    chrome.tabs.create(p)
  )
  .register(ServiceFunc.getPipWindow, getPipWindow)
  .register(ServiceFunc.getMyTab, () =>
    chrome.tabs.get(currentSender!.tab!.id!)
  )

async function handleInvokeRequest(
  message: any,
  sender: chrome.runtime.MessageSender
) {
  currentSender = sender
  let result = await contentInvoke.handleReqMsg(message)

  if (!sender.tab?.id) {
    console.error("sender tab id is undefined", sender)
  }

  if (result) {
    chrome.tabs.sendMessage(sender.tab?.id!, {
      type: MessageType.invokeResponse,
      ...result,
    })
  }
}

function handleMessage(message: any, sender: chrome.runtime.MessageSender) {
  console.log("[bg]: ", message.type, message, sender, Date.now())
  switch (message?.type) {
    case MessageType.bgOpenPip:
      openPipBackground(message.url)
      break
    case MessageType.bgPipLaunch:
      pipLaunch(message.url)
      break
    case MessageType.updateWindow:
      updateWindow(message.options)
      break
    case MessageType.removeWindow:
      chrome.windows.remove(message.options.windowId)
      break
    case MessageType.forwardToTab:
      chrome.tabs.sendMessage(message.tabId, message.message)
      break
    case MessageType.invokeRequest:
      handleInvokeRequest(message, sender)
      break
    case MessageType.contentMounted:
      handleContentMounted(sender.tab!.id!)
      break
    case MessageType.registerContentSidebar:
      registerContentSidebar({ tabId: sender.tab!.id!, url: message.url })
      break
    case MessageType.unregisterContentSidebar:
      unregisterContentSidebar(sender.tab!.id!)
      break
  }
}

async function handleToggleMinimize() {
  const { pipWindow } = await chrome.storage.local.get({ pipWindow: null })
  if (!pipWindow) return
  const windowInfo = await chrome.windows.get(pipWindow.windowId)
  if (!windowInfo) return

  const tabId = pipWindow.tabId

  contentInvoke.invoke({
    tabId,
    func: ServiceFunc.toggleMinimize,
    args: [],
  })
}

function handleCommand(command: string) {
  console.log("command: ", command)
  switch (command) {
    case "toggleMinimize":
      handleToggleMinimize()
      break
  }
}

async function updateConfig() {
  const url = "https://config.ziziyi.com/anything-copilot"
  const now = Date.now()

  let {
    timestamp,
    configVersion,
    chatDocSites,
    webviewPatchs,
    popularSites,
    loadCandidates,
  } = await getLocal({
    timestamp: {} as Record<string, number>,
    configVersion: config.data.configVersion,
    chatDocSites: config.data.chatDocSites,
    webviewPatchs: config.data.webviewPatchs,
    popularSites: config.data.popularSites,
    loadCandidates: config.data.loadCandidates,
  })

  if (
    timestamp.configUpdatedAt > 0 &&
    now - timestamp.configUpdatedAt < 1000 * 60 * 60 * 24
  ) {
    return
  }

  const res = await fetch(url)
  const data = await res.json()

  if (data.configVersion < configVersion) {
    return
  }

  if (
    Array.isArray(data.chatDocSites) &&
    data.chatDocSites.every((i: any) => i.host && i.selector)
  ) {
    chatDocSites = data.chatDocSites
  }
  if (data.webviewPatchs && Array.isArray(data.webviewPatchs)) {
    webviewPatchs = data.webviewPatchs
  }
  if (data.popularSites && Array.isArray(data.popularSites)) {
    popularSites = data.popularSites
  }
  if (data.loadCandidates && Array.isArray(data.loadCandidates)) {
    loadCandidates = data.loadCandidates
  }

  timestamp.configUpdatedAt = now
  await chrome.storage.local.set({
    timestamp,
    chatDocSites,
    webviewPatchs,
    popularSites,
    loadCandidates,
  })
}
