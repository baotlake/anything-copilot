import { MessageType } from "@/types";
import { waitMessage, tabUpdated } from "@/utils/ext";

async function openPipBackground(url: string) {
  const tab = await chrome.tabs.create({
    url: url,
  });

  await tabUpdated({ tabId: tab.id!, status: "complete" });

  chrome.tabs.sendMessage(tab.id!, {
    type: "pip",
    options: {
      url: url,
      mode: "write-html",
    },
  });
}

async function getContentCss(id: number, url: string) {
  const res = await fetch(url);
  const text = await res.text();

  chrome.tabs.sendMessage(id, {
    type: "content-css",
    payload: {
      url: url,
      value: text,
    },
  });
}

async function pipLaunch(url: string) {
  const tab = await chrome.tabs.create({ url });
  await waitMessage({
    tabId: tab.id!,
    type: MessageType.contentMount,
  });
  chrome.tabs.sendMessage(tab.id!, {
    type: MessageType.pipLaunch,
    url: url,
  });
}

type QueryOptions = {
  windowId?: number;
  width?: number;
  height?: number;
};
async function getPipWindow(
  id: number,
  { windowId, width, height }: QueryOptions
) {
  if (windowId) {
    const win = await chrome.windows.get(windowId);
    chrome.tabs.sendMessage(id, {
      type: MessageType.pipWinInfo,
      window: win,
    });
    return win;
  }

  const windows = await chrome.windows.getAll({});
  const win = windows.find((w) => w.width === width && w.height === height);
  chrome.tabs.sendMessage(id, {
    type: MessageType.pipWinInfo,
    window: win,
  });
  return win;
}

type MinimizeOptions = {
  windowId: number;
};
async function minimizePip({ windowId }: MinimizeOptions) {
  await chrome.windows.update(windowId, { state: "minimized" });
}

type UpdatePipWinOption = {
  windowId: number;
  windowInfo: Partial<chrome.windows.UpdateInfo>;
};

async function updatePipWin({ windowId, windowInfo }: UpdatePipWinOption) {
  await chrome.windows.update(windowId, windowInfo);
}

function handleMessage(message: any, sender: chrome.runtime.MessageSender) {
  console.log("bg message: ", message, sender);
  switch (message?.type) {
    case MessageType.bgOpenPip:
      openPipBackground(message.url);
      break;
    case "get-content-css":
      getContentCss(sender.tab?.id || 0, message.url);
      break;
    case MessageType.bgPipLaunch:
      pipLaunch(message.url);
      break;
    case MessageType.getPipWinInfo:
      getPipWindow(sender.tab?.id!, message.options);
      break;
    case MessageType.minimizePipWin:
      minimizePip(message.options);
      console.log(message, sender);
      break;
    case MessageType.updatePipWin:
      updatePipWin(message.options);
      break;
  }
}

chrome.runtime.onMessage.addListener(handleMessage);

async function handleToggleMinimize() {
  const { pipWindowId } = await chrome.storage.local.get({ pipWindowId: null });
  if (!pipWindowId) return;
  const windowInfo = await chrome.windows.get(pipWindowId);
  if (!windowInfo) return;
  await chrome.windows.update(pipWindowId, {
    state: windowInfo.state == "minimized" ? "normal" : "minimized",
  });
}

function handleCommand(command: string) {
  console.log("command: ", command);
  switch (command) {
    case "toggleMinimize":
      handleToggleMinimize();
      break;
  }
}

chrome.commands.onCommand.addListener(handleCommand);
