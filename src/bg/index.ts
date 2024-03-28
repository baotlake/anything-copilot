import {
  MessageType,
  ServiceFunc,
  type ParseDocOptions,
  ContentScriptId,
} from "@/types"
import { waitMessage, tabUpdated, getLocal } from "@/utils/ext"
import { offscreen } from "./offscreen"
import {
  registerContentSidebar,
  unregisterContentSidebar,
  handleContentMounted,
} from "./sidebar"
import config from "@/assets/config.json"
import { allFrameScript, contentMainScript } from "@/manifest"
import { getIsEdge } from "@/utils/ext"

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

type QueryOptions = {
  windowId?: number
  width?: number
  height?: number
}
async function getPipWindow(
  id: number,
  { windowId, width, height }: QueryOptions
) {
  if (windowId) {
    const win = await chrome.windows.get(windowId)
    chrome.tabs.sendMessage(id, {
      type: MessageType.pipWinInfo,
      window: win,
    })
    return win
  }

  const windows = await chrome.windows.getAll({})
  const win = windows.find((w) => w.width === width && w.height === height)
  chrome.tabs.sendMessage(id, {
    type: MessageType.pipWinInfo,
    window: win,
  })
  return win
}

type UpdatePipWinOption = {
  windowId: number
  windowInfo: Partial<chrome.windows.UpdateInfo>
}

async function updateWindow({ windowId, windowInfo }: UpdatePipWinOption) {
  await chrome.windows.update(windowId, windowInfo)
}

async function handleInvokeRequest(
  message: any,
  sender: chrome.runtime.MessageSender
) {
  const { key, func, args } = message

  let result = null
  let error = null
  try {
    switch (func) {
      case ServiceFunc.parseDoc:
      case ServiceFunc.calcTokens:
      case ServiceFunc.tokenSlice:
        result = await offscreen.invoke({
          func,
          args,
        })
        break
    }
  } catch (err) {
    console.error("invoke error: ", err)
    error = err
  }

  console.log("invoke response: ", result, error)

  if (!sender.tab?.id) {
    console.error("sender tab id is undefined", sender)
  }

  chrome.tabs.sendMessage(sender.tab?.id!, {
    type: MessageType.invokeResponse,
    key,
    success: !error,
    payload: !error ? result : error,
  })
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
    case MessageType.getPipWinInfo:
      getPipWindow(sender.tab?.id!, message.options)
      break
    case MessageType.updateWindow:
      updateWindow(message.options)
      break
    case MessageType.removeWindow:
      chrome.windows.remove(message.options.windowId)
      break
    case MessageType.setupOffscreenDocument:
      return offscreen.setup()
    case MessageType.fromOffscreen:
      return offscreen.handleMessage(message)
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
  const { pipWindowId } = await chrome.storage.local.get({ pipWindowId: null })
  if (!pipWindowId) return
  const windowInfo = await chrome.windows.get(pipWindowId)
  if (!windowInfo) return
  await chrome.windows.update(pipWindowId, {
    state: windowInfo.state == "minimized" ? "normal" : "minimized",
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
