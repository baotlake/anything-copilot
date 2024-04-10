import { reactive, ref } from "vue"

export const pipWindow = reactive({
  id: 0,
  window: null as Window | null,
  windowsWindow: null as chrome.windows.Window | null,
  tab: null as chrome.tabs.Tab | null,
  tabId: 0,
  icon: "" as string,
})
