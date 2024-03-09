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

const logoUrl = chrome.runtime.getURL("/logo.svg")
const { t } = useI18n()

const url = ref("")
const mode = ref("")
const popularItems = reactive(config.data.popularSites)
const recentItems = reactive<{ url: string; title: string; icon: string }[]>([])

const protectedUrl = computed(() => {
  return isProtectedUrl(url.value)
})

const currentTab = reactive({
  tabId: 0,
})

async function handleMessage(message: any) {
  switch (message.type) {
    case MessageType.openInSidebar:
      if (!currentTab.tabId) {
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

async function removeRecentItems(url: string) {
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
  <div class="w-full h-screen">
    <Webview v-if="!protectedUrl" :url="url" @page-info="updateRecentItems" />

    <div v-else class="flex flex-col p-6 max-w-md mx-auto">
      <div class="flex flex-col items-center gap-2 mx-auto mt-16">
        <img :src="logoUrl" class="size-16" />
        <span class="text-2xl font-bold my-2">{{ t("sidebar") }}</span>
      </div>

      <div class="grid grid-cols-4 gap-y-4 justify-between mt-24">
        <SiteButton
          v-for="item of recentItems"
          :icon="item.icon"
          :title="item.title"
          badge="remove"
          @click="go(item.url)"
          @remove="() => removeRecentItems(item.url)"
        />
      </div>

      <!-- <div class="text-center my-3">Popular</div> -->
      <div class="w-full my-6 border-b border-b-slate-400/60 h-0"></div>
      <div class="grid grid-cols-4 gap-y-4 justify-between">
        <SiteButton
          v-for="item of popularItems"
          :icon="item.icon"
          :title="item.title"
          @click="go(item.url)"
        />
      </div>
    </div>
  </div>

  <!-- <LoadingBar /> -->
</template>

<style scoped></style>
