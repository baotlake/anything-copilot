import { createApp } from "vue";
import App from "./App.vue";
import "@/assets/main.css";

export function mountApp() {
  const outter = document.createElement("anything-copilot");
  const shadowRoot = outter.attachShadow({ mode: "open" });
  const appContainer = document.createElement("div");
  appContainer.id = "app";

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("/index.css");
  shadowRoot.append(link);
  shadowRoot.append(appContainer);
  document.documentElement.append(outter);
  createApp(App).mount(appContainer);

  // chrome.runtime.sendMessage({
  //   type: "get-content-css",
  //   url: "/index.css",
  // });
}

export function waitMountApp() {
  if (document.readyState == "interactive") {
    mountApp();
  } else {
    const hanldeStateChange = () => {
      if (document.readyState == "interactive") {
        document.removeEventListener("readystatechange", hanldeStateChange);
        mountApp();
      }
    };
    document.addEventListener("readystatechange", hanldeStateChange);
  }
}
