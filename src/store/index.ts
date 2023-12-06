import { reactive, ref } from "vue";

export const contentCss = ref("");

export const pipLauncher = reactive({
  visible: false,
});

export const items = reactive([
  {
    url: "https://chat.openai.com/",
    img: "/chatgpt.svg",
    title: "ChatGPT - OpenAI",
  },
  {
    url: "https://bard.google.com/",
    img: "/bard.svg",
    title: "Bard - Google AI",
  },
  {
    url: "https://claude.ai/",
    img: "/claude-ai.svg",
    title: "Claude",
  },
  {
    url: "https://tiktok.com/",
    img: "/tiktok.svg",
    title: "Tiktok",
  },
]);

export const pipWindow = reactive({
  id: 0,
  window: null as Window | null,
  windowsWindow: null as chrome.windows.Window | null,
  tab: null as chrome.tabs.Tab | null,
});

export const pipLoading = reactive({
  isLoading: true,
  splashScreen: true,
});
