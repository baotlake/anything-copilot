import { reactive, ref } from "vue"

export const pipLauncher = reactive({
  visible: false,
})

export const pipWindow = reactive({
  id: 0,
  window: null as Window | null,
  windowsWindow: null as chrome.windows.Window | null,
  tab: null as chrome.tabs.Tab | null,
})

export const pipLoading = reactive({
  isLoading: true,
  splashScreen: true,
})

export const docsAddon = reactive({
  visible: false,
  active: false,
})

type DocInputItem = {
  key: string
  kind: "file" | "string"
  type: string
  data: File | string
}

type Content = {
  data: string
  selected: boolean
  sentLength: number
}

type DocMap = Record<
  string,
  {
    key: string
    kind: "string" | "file"
    name: string
    loading: boolean
    success: boolean
    removed: boolean
    contents: Content[]
  }
>

export const chatDocsPanel = reactive({
  visible: false,

  inputs: [] as DocInputItem[],
  docMap: {} as DocMap,
})
