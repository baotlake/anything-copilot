import { MessageType } from "@/types"

type ContentSidebar = {
  tabId: number
  url?: string
}

const contentSidebarMap = new Map<number, ContentSidebar>()

export function registerContentSidebar({ tabId, url }: ContentSidebar) {
  contentSidebarMap.set(tabId, { tabId, url })
}

export function unregisterContentSidebar(tabId: number) {
  contentSidebarMap.delete(tabId)
}

export async function handleContentMounted(tabId: number) {
  const sidebar = contentSidebarMap.get(tabId)
  if (sidebar) {
    await chrome.storage.session.set({
      sidebarUrls: { content: sidebar.url },
    })
    chrome.tabs.sendMessage(tabId, {
      type: MessageType.openContentSidebar,
      url: sidebar.url,
    })
  }
}
