import "@/assets/main.css";

import { createApp } from "vue";
import Popup from "./Popup.vue";
import { i18n } from "@/utils/i18n";

const app = createApp(Popup);

app.use(i18n);
app.mount("#app");
 