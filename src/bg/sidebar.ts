import { MessageType } from "@/types"
import { messageInvoke } from "@/utils/invoke"
import { ServiceFunc } from "@/types"
import { openSidebar } from "@/utils/ext"

type ContentSidebarItem = {
  visible: boolean
  tabId: number
  urls: string[]
}

const contentSidebarMap = new Map<number, ContentSidebarItem>()

export function registerContentSidebar(
  tabId: number,
  info: Partial<ContentSidebarItem>
) {
  const item = contentSidebarMap.get(tabId) || { visible: false, urls: [] }
  contentSidebarMap.set(tabId, {
    ...item,
    ...info,
    tabId,
  })
}

export async function handleContentMounted(
  sender: chrome.runtime.MessageSender
) {
  if (sender.frameId !== 0) return
  if (!sender.tab) return
  const tabId = sender.tab.id!

  const item = contentSidebarMap.get(tabId)
  console.log("handleContentMounted", item)
  if (item && item.visible) {
    openSidebar({
      urls: item.urls,
      tab: sender.tab,
      sidePanel: false,
    })
  }
}

export function getContentSidebarItem(tabId: number) {
  return contentSidebarMap.get(tabId)
}
