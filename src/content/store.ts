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
