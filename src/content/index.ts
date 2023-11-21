import { mount, waitMountApp } from "./ui";
import {
  contentCss,
  pipLauncher,
  pipLoading,
  pipWindowInfo,
  pipWindowRef,
} from "./store";
import { MessageType } from "@/types";
import Copilot from "./Copilot.vue";
import { waitMessage } from "@/utils/ext";
import { PipEventName } from "@/types/pip";

function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (res: any) => void
) {
  console.log(message, sender);
  switch (message?.type) {
    case MessageType.pip:
      document.dispatchEvent(
        new CustomEvent(PipEventName.pip, { detail: message.options })
      );
      break;
    case "content-css":
      contentCss.value = message.payload?.value || "";
      break;
    case MessageType.pipLaunch:
      pipLauncher.visible = true;
      break;
    case MessageType.hiContent:
      chrome.runtime.sendMessage({
        type: MessageType.contentHere,
      });
      sendResponse({ type: MessageType.contentHere });
      break;
    case MessageType.pipWinInfo:
      pipWindowInfo.value = message.window;
      chrome.storage.local.set({
        pipWindowId: message.window.id,
      });
      break;
  }
}

async function handlePipEvent(event: any) {
  const pipWindow = await new Promise<Window | null>((r) => {
    const docPip = window.documentPictureInPicture;
    const handleEnter = () => {
      r(docPip.window);
      docPip?.removeEventListener("enter", handleEnter);
    };
    docPip?.addEventListener("enter", handleEnter);
  });

  console.log("content pip event: ", event);

  if (pipWindow) {
    pipWindowRef.value = pipWindow;
    mount(Copilot, pipWindow.document);

    await new Promise<void>((r) => {
      document.addEventListener(PipEventName.loaded, (e) => {
        console.log("load", e);
        r();
      });
    });

    // may be 0 if not wait document is loaded
    chrome.runtime.sendMessage({
      type: MessageType.getPipWinInfo,
      options: {
        width: pipWindow.outerWidth,
        height: pipWindow.outerHeight,
      },
    });

    pipWindow.addEventListener("pagehide", () => {
      chrome.storage.local.set({
        pipWindowId: undefined,
      });
    });
  }
}

async function handlePipLoadedEvent(e: Event) {
  console.log("e: ", e);
  pipLoading.splashScreen = false;
  pipLoading.isLoading = false;
  const pipWindow = window.documentPictureInPicture.window;
  if (pipWindow) {
    mount(Copilot, pipWindow.document);
  }
}

async function handlePopLoadDocEvent(e: CustomEvent | Event) {
  pipLoading.isLoading = true;
}

chrome.runtime.onMessage.addListener(handleMessage);
document.addEventListener(PipEventName.pip, handlePipEvent);
document.addEventListener(PipEventName.loaded, handlePipLoadedEvent);
document.addEventListener(PipEventName.loadDoc, handlePopLoadDocEvent);
waitMountApp();
