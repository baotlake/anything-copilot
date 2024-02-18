import type { chatDocsPanel } from "@/store"

type Selector = {
  input: string
  send: string
  wait: string | { target: string; match: string }[]
}

export interface SiteConfig {
  prompt: string
  maxInput: number
  maxInputType: "char" | "token"
  maxRuns: number
  selector: Selector | null
}

export const devConfig = {
  host: chrome.runtime.id + "-",
  path: "^/dev.html",
  maxInputLength: 8000,
  maxInputToken: 4096,
  selector: {
    input: "form textarea#prompt-textarea",
    send: "form textarea ~ button",
    wait: "form textarea ~ button",
  },
}

export async function getDocItem(itemList: DataTransferItemList | FileList) {
  const items: typeof chatDocsPanel.inputs = []
  for (let i = 0; i < itemList.length; i++) {
    const item = itemList[i]

    if ("name" in item) {
      items.push({
        key: crypto.randomUUID(),
        kind: "file" as const,
        type: item.type,
        data: item,
      })
      continue
    }

    if (item.kind == "file") {
      const file = item.getAsFile()
      if (file) {
        items.push({
          key: crypto.randomUUID(),
          kind: item.kind,
          type: item.type,
          data: file,
        })
      }
    }

    if (item.kind == "string") {
      const { kind, type } = item
      const data = await new Promise<string>((r) => item.getAsString(r))
      items.push({
        key: crypto.randomUUID(),
        kind,
        type,
        data,
      })
    }
  }

  return items
}
