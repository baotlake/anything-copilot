import "@/assets/main.css"

import { createApp } from "vue"
import Guide from "./Popup.vue"
import { i18n } from "@/utils/i18n"

const app = createApp(Guide)

app.use(i18n)
app.mount("#app")
