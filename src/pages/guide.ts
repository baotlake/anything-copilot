import "@/assets/main.css";

import { createApp } from "vue";
import Guide from "./Popup.vue";

createApp(Guide).mount("#app");

function injectContent() {
  const mainScript = document.createElement("script");
  mainScript.src = "/main.js";
  const script = document.createElement("script");
  script.src = "/content.js";
  document.head.append(mainScript);
  document.head.append(script);
}

injectContent();
