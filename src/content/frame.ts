import { MessageType } from "@/types"

chrome.runtime.sendMessage({
  type: MessageType.frameReady,
})
