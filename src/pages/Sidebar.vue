<script setup lang="ts">
import { ref, onMounted, reactive, computed, onUnmounted } from "vue"
import {
  emptyTab,
  getLocal,
  getSession,
  isProtectedUrl,
  updateFrameNetRules,
} from "@/utils/ext"
import config from "@/assets/config.json"
import LoadingBar from "@/components/LoadingBar.vue"
import Webview from "@/components/Webview.vue"
import { useI18n } from "@/utils/i18n"
import { MessageType } from "@/types"
import SiteButton from "@/components/SiteButton.vue"
import Search from "@/components/Search.vue"
import SidebarHome from "@/components/sidebar/SidebarHome.vue"

const logoUrl = chrome.runtime.getURL("/logo.svg")
const { t } = useI18n()

const url = ref("")
const mode = ref("")
const popularItems = reactive(config.data.popularSites)
const recentItems = reactive<{ url: string; title: string; icon: string }[]>([])
const currentTab = reactive({
  tabId: 0,
})
const ua = ref("")

const protectedUrl = computed(() => {
  return isProtectedUrl(url.value)
})

async function handleMessage(message: any) {
  switch (message.type) {
    case MessageType.openInSidebar:
      if (currentTab.tabId == 0) {
        const current = await chrome.tabs.getCurrent()
        currentTab.tabId = current?.id || -1
      }
      if (message.tabId == currentTab.tabId) {
        url.value = message.url
      }
      break
  }
}

async function updateRecentItems(pageInfo: {
  url: string
  title: string
  icon: string
}) {
  if (mode.value === "content") {
    chrome.runtime.sendMessage({
      type: MessageType.registerContentSidebar,
      url: url.value,
    })
  }

  const { sidebarRecentItems } = await getLocal({
    sidebarRecentItems: [] as {
      url: string
      icon: string
      title: string
    }[],
  })

  const index = sidebarRecentItems.findIndex((i) => i.url === pageInfo.url)
  if (index !== -1) {
    sidebarRecentItems.splice(index, 1)
  }
  sidebarRecentItems.unshift(pageInfo)
  sidebarRecentItems.splice(12)
  recentItems.splice(0, recentItems.length, ...sidebarRecentItems)

  await chrome.storage.local.set({ sidebarRecentItems })
}

async function removeRecentItem(url: string) {
  const { sidebarRecentItems } = await getLocal({
    sidebarRecentItems: [] as {
      url: string
      icon: string
      title: string
    }[],
  })

  const index = sidebarRecentItems.findIndex((i) => i.url === url)
  if (index !== -1) {
    sidebarRecentItems.splice(index, 1)
  }
  recentItems.splice(0, recentItems.length, ...sidebarRecentItems)
  await chrome.storage.local.set({ sidebarRecentItems })
}

onMounted(() => {
  const q = new URLSearchParams(location.search)
  mode.value = q.get("mode") || "sidepanel"
  // ua.value =
  //   "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"

  getLocal({
    popularSites: config.data.popularSites,
    sidebarRecentItems: [],
  }).then(({ popularSites, sidebarRecentItems }) => {
    if (popularSites) {
      popularItems.splice(0, popularItems.length, ...popularSites)
    }
    if (sidebarRecentItems) {
      recentItems.splice(0, recentItems.length, ...sidebarRecentItems)
    }
  })

  getSession({
    sidebarUrls: {} as Record<string, string>,
  }).then(({ sidebarUrls }) => {
    console.log("[sidebar]", sidebarUrls, mode.value)
    if (sidebarUrls && sidebarUrls[mode.value]) {
      url.value = sidebarUrls[mode.value]
    }
  })

  chrome.tabs.getCurrent().then((t) => {
    currentTab.tabId = t?.id || -1
  })

  chrome.runtime.onMessage.addListener(handleMessage)
})

onUnmounted(() => {
  chrome.runtime.onMessage.removeListener(handleMessage)
})

function go(link: string) {
  url.value = link
}
</script>

<template>
  <div class="w-full h-screen flex flex-col">
    <div class="w-full h-full" v-if="!protectedUrl">
      <Webview :url="url" :ua="ua" @page-info="updateRecentItems" />
    </div>

    <SidebarHome
      v-else
      :recentItems="recentItems"
      :popularItems="popularItems"
      @go="go"
      @remove-recent-item="removeRecentItem"
    />
  </div>

  <!-- <LoadingBar /> -->
</template>

<style scoped></style>
