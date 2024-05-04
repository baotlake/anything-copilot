import "@/assets/main.css"

import { createApp } from "vue"
import { i18n } from "@/utils/i18n"
import { messageInvoke } from "@/utils/invoke"
import Sidebar from "./Sidebar.vue"
import { MessageType } from "@/types"

const app = createApp(Sidebar)

app.use(i18n)
app.mount("#app")

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[sidebar] ", message.type, message, sender)
  switch (message.type) {
    case MessageType.invokeResponse:
      messageInvoke.handleResMsg(message)
      break
    case MessageType.invokeRequest:
      messageInvoke.handleReqMsg(message, sender)
      break
  }
})
