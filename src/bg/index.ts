import {
  MessageType,
  ServiceFunc,
  type ParseDocOptions,
  ContentScriptId,
} from "@/types"
import { waitMessage, tabUpdated, getLocal, getPipWindow } from "@/utils/ext"
import {
  createOffscreenDocument,
  offscreenHtmlPath,
  setupOffscreen,
} from "./offscreen"
import {
  registerContentSidebar,
  handleContentMounted,
  getContentSidebarItem,
} from "./sidebar"
import config from "@/assets/config.json"
import { allFrameScript, contentMainScript } from "@/manifest"
import { getIsEdge } from "@/utils/ext"
import { messageInvoke } from "@/utils/invoke"

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
chrome.runtime.onInstalled.addListener(handleOnInstalled)
chrome.contextMenus.onClicked.addListener(handleContextMenusClicked)

if (isEdge && chrome.sidePanel) {
  chrome.sidePanel.setOptions({
    enabled: false,
  })
}

async function handleOnInstalled(details: chrome.runtime.InstalledDetails) {
  chrome.contextMenus.create({
    contexts: ["action"],
    id: "toggle-sidebar",
    title: "Toggle Sidebar",
  })

  chrome.contextMenus.create({
    contexts: ["link"],
    id: "open-in-sidebar",
    title: "Open Link in Sidebar",
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

messageInvoke
  .register(ServiceFunc.setupOffscreen, () => setupOffscreen())
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
  let res = await messageInvoke.handleReqMsg(message)

  if (!sender.tab?.id) {
    console.error("sender tab id is undefined", sender)
  }

  if (res) {
    chrome.tabs.sendMessage(sender.tab?.id!, {
      type: MessageType.invokeResponse,
      ...res,
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
      currentSender = sender
      messageInvoke.handleReqMsg(message, sender)
      break
    case MessageType.invokeResponse:
      messageInvoke.handleResMsg(message)
      break
    case MessageType.contentMounted:
      handleContentMounted(sender)
      break
    case MessageType.registerContentSidebar:
      registerContentSidebar(sender.tab!.id!, message.info)
      break
  }
}

async function toggleMinimize() {
  const { pipWindow } = await chrome.storage.local.get({ pipWindow: null })
  if (!pipWindow) return
  const windowInfo = await chrome.windows.get(pipWindow.windowId)
  if (!windowInfo) return

  const tabId = pipWindow.tabId

  messageInvoke.invoke({
    func: ServiceFunc.toggleMinimize,
    args: [],
    tabId,
  })
}

async function toggleSidebar(tab?: chrome.tabs.Tab) {
  if (tab?.windowId) {
    chrome.sidePanel.open({
      windowId: tab?.windowId,
    })
  }
  messageInvoke.invoke({
    func: ServiceFunc.toggleSidebar,
    args: [],
  })
}

async function openInSidebar(url: string, tab?: chrome.tabs.Tab) {
  let contentMode = isEdge || !chrome.sidePanel

  const contentSidebar = getContentSidebarItem(tab?.id!)
  if (contentSidebar && contentSidebar.visible) {
    contentMode = true
  }

  if (contentMode) {
    await messageInvoke.invoke({
      func: ServiceFunc.toggleContentSidebar,
      args: [{ visible: true, collapse: false }],
      tabId: tab?.id,
    })
  } else {
    await chrome.sidePanel.open({
      windowId: tab?.windowId!,
    })
  }

  await messageInvoke.invoke({
    key: ServiceFunc.waitSidebar,
    func: ServiceFunc.waitSidebar,
    args: [],
    timeout: 300,
  })

  await messageInvoke.invoke({
    func: ServiceFunc.openInSidebar,
    args: [{ urls: [url] }],
  })
}

function handleCommand(command: string, tab?: chrome.tabs.Tab) {
  console.log("command: ", command)
  switch (command) {
    case "toggleMinimize":
      toggleMinimize()
      break
    case "toggleSidebar":
      toggleSidebar(tab)
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

async function handleContextMenusClicked(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) {
  console.log(info)
  switch (info.menuItemId) {
    case "toggle-sidebar":
      toggleSidebar(tab)
      break
    case "open-in-sidebar":
      openInSidebar(info.linkUrl!, tab)
      break
  }
}
