import "@/assets/main.css"

import { createApp } from "vue"
import { i18n } from "@/utils/i18n"
import Sidebar from "./Sidebar.vue"

const app = createApp(Sidebar)

app.use(i18n)
app.mount("#app")
