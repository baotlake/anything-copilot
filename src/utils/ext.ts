import { MessageType } from "@/types";

type MessageSender = chrome.runtime.MessageSender;

type UpdatedOption = {
  tabId: number;
  status: string;
  timeout?: number;
};

export async function tabUpdated({ tabId, status, timeout }: UpdatedOption) {
  return new Promise<void>((r) => {
    const handleUpdate = (id: number, info: chrome.tabs.TabChangeInfo) => {
      console.log(id, info);
      if (id === tabId && info.status === status) {
        chrome.tabs.onUpdated.removeListener(handleUpdate);
        r();
      }
    };
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(handleUpdate);
      r();
    }, timeout || 30 * 1000);
    chrome.tabs.onUpdated.addListener(handleUpdate);
  });
}

type WaitMessageOption = {
  type: string;
  tabId?: number;
  timeout?: number;
};

export async function waitMessage<T = unknown>({
  type,
  tabId,
  timeout,
}: WaitMessageOption): Promise<T> {
  return new Promise<T>((r, reject) => {
    let timer = 0;
    const handleMessage = (message: any, sender: MessageSender) => {
      const sameId = typeof tabId == "number" ? tabId == sender.tab?.id : true;
      if (sameId && message.type == type) {
        chrome.runtime.onMessage.removeListener(handleMessage);
        r(message);
        clearTimeout(timer);
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    if (timeout) {
      timer = setTimeout(() => {
        chrome.runtime.onMessage.removeListener(handleMessage);
        reject();
      }, timeout);
    }
  });
}

export const emptyTab: chrome.tabs.Tab = {
  active: false,
  autoDiscardable: false,
  discarded: false,
  highlighted: false,
  selected: false,
  groupId: 0,
  height: 0,
  id: 0,
  incognito: false,
  index: 0,
  pinned: false,
  windowId: 0,
};

export async function checkContent(tabId: number) {
  let alive = false;

  try {
    const resMsgPromise = new Promise<void>((r) => {
      const handleMessage = (message: any, sender: MessageSender) => {
        if (sender.tab?.id == tabId) {
          alive = true;
          r();
          chrome.runtime.onMessage.removeListener(handleMessage);
        }
      };
      setTimeout(() => r(), 3000);
      chrome.runtime.onMessage.addListener(handleMessage);
    });

    const res = await chrome.tabs.sendMessage(tabId, {
      type: MessageType.hiContent,
    });
    alive = !!res;

    console.log("hi-content response: ", alive, res);

    if (!alive) {
      await resMsgPromise;
    }
  } catch (err) {
    console.error(err);
  }

  console.log("checkContent alive: ", alive);

  if (alive) {
    return true;
  }

  const manifest = chrome.runtime.getManifest();
  if (!manifest.content_scripts) {
    return false;
  }

  try {
    for (let item of manifest.content_scripts) {
      if (item.js) {
        const world =
          "world" in item && item.world == "MAIN" ? "MAIN" : "ISOLATED";

        await chrome.scripting.executeScript({
          files: item.js,
          target: { tabId: tabId },
          world: world,
        });
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}
