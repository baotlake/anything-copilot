import { createApp, type Component } from "vue"
import App from "./App.vue"
import { MessageType } from "@/types"
import { i18n } from "@/utils/i18n"
import "@/assets/main.css"

const isSelf = chrome.runtime?.id === location.host

export function mount(App: Component, doc = document) {
  const outter = doc.createElement("anything-copilot")
  const root = isSelf ? outter : outter.attachShadow({ mode: "open" })
  const appContainer = doc.createElement("div")
  appContainer.id = "app"

  const link = doc.createElement("link")
  link.rel = "stylesheet"
  link.href = chrome.runtime?.getURL("/assets/index.css")
  root.append(link)
  root.append(appContainer)
  doc.documentElement.append(outter)

  const app = createApp(App)
  app.use(i18n)
  app.mount(appContainer)
}

export function mountApp(doc = document) {
  mount(App, doc)
  chrome.runtime?.sendMessage({ type: MessageType.contentMount })
}

export function waitMountApp() {
  if (document.readyState == "interactive") {
    mountApp()
  } else {
    const hanldeStateChange = () => {
      if (document.readyState == "interactive") {
        document.removeEventListener("readystatechange", hanldeStateChange)
        mountApp()
      }
    }
    document.addEventListener("readystatechange", hanldeStateChange)
  }
}
