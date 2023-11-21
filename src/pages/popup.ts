import "@/assets/main.css";

import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import Popup from "./Popup.vue";

const i18n = createI18n({});

const app = createApp(Popup);

app.use(i18n);
app.mount("#app");
