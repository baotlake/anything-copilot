import { pip, pipEventName } from "./pip";
import { waitMountApp } from "./ui";
import { contentCss, pipLauncher } from "./store";

function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (res: any) => void
) {
  console.log(message, sender);
  switch (message?.type) {
    case "pip":
      document.dispatchEvent(
        new CustomEvent(pipEventName, { detail: message.options })
      );
    case "content-css":
      contentCss.value = message.payload?.value || "";
      break;
    case "pip-launch":
      pipLauncher.visible = true;
      break;
    case "hi-content":
      chrome.runtime.sendMessage({
        type: "content-here",
      });
      sendResponse({ type: "content-here" });
      break;
  }
}

chrome.runtime.onMessage.addListener(handleMessage);

waitMountApp();
