import "@/assets/main.css"
import { createApp } from "vue"
import "@/content/index"
// import "@/pages/popup"

import Dev from "./Dev.vue"

import { i18n } from "@/utils/i18n"

const app = createApp(Dev)
app.use(i18n)
app.mount("#app")
