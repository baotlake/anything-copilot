import "@/assets/main.css"

import { createApp } from "vue"
import Chat from "./Chat.vue"
import { i18n } from "@/utils/i18n"

const app = createApp(Chat)

app.use(i18n)
app.mount("#app")
