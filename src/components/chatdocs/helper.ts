import type { chatDocsPanel } from "@/store"

export const sitesConfig = [
  {
    host: "huggingface.co",
    path: /^\/chat/,
    maxInputLength: 8000, // 2048 token
    selector: {
      input: "form[tabindex] textarea",
      send: 'form[tabindex] button[type="submit"]',
      wait: 'form[tabindex] button[type="submit"]:not([disabled=true])',
    },
  },
  {
    host: "chat.openai.com",
    path: /./,
    maxInputLength: 8000,
    maxInputToken: 4096,
    selector: {
      input: "form textarea#prompt-textarea",
      send: "form textarea ~ button",
      wait: "form textarea ~ button",
    },
  },
  {
    host: "bard.google.com",
    path: /chat/,
    maxInputLength: 4096,
    selector: {
      input: "input-area rich-textarea div",
      send: "input-area div[class*=send] button[class*=send]",
      wait: "input-area div[class*=send] button[class*=send]",
    },
  },
  {
    host: "copilot.microsoft.com",
    path: /./,
    maxInputLength: 2048,
    selector: {
      input:
        "cib-serp /deep/ cib-action-bar /deep/ cib-text-input /deep/ textarea",
      send: "cib-serp /deep/ cib-action-bar /deep/ .bottom-right-controls button",
      wait: "cib-serp /deep/ cib-action-bar /deep/ cib-typing-indicator /deep/ button[disabled]",
    },
  },
  {
    host: "yiyan.baidu.com",
    path: /./,
    maxInputLength: 2000,
    selector: {
      input: "textarea:not(h1 ~ textarea)",
      send: 'div > span:has(svg[width="240"])',
      wait: 'div > span:has(svg[width="240"]):not([style*="display: none"])',
    },
  },
  {
    host: chrome.runtime.id + "-",
    path: /^\/dev.html/,
    maxInputLength: 8000,
    maxInputToken: 4096,
    selector: {
      input: "form textarea#prompt-textarea",
      send: "form textarea ~ button",
      wait: "form textarea ~ button",
    },
  },
]

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
