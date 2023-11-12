import { tabUpdated } from "@/utils/ext";

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
  await tabUpdated({ tabId: tab.id!, status: "complete" });
  chrome.tabs.sendMessage(tab.id!, {
    type: "pip-launch",
    url: url,
  });
}

function handleMessage(message: any, sender: chrome.runtime.MessageSender) {
  console.log("bg message: ", message, sender);
  switch (message?.type) {
    case "bg-open-pip":
      openPipBackground(message.url);
      break;
    case "get-content-css":
      getContentCss(sender.tab?.id || 0, message.url);
      break;
    case "bg-pip-launch":
      pipLaunch(message.url);
      break;
  }
}

chrome.runtime.onMessage.addListener(handleMessage);
