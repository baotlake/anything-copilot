<script setup lang="ts">
import { ref, onMounted, reactive, computed, onUnmounted, watch } from "vue"
import {
  getLocal,
  getSession,
  isProtectedUrl,
  updateFrameNetRules,
  updateUANetRules,
} from "@/utils/ext"
import config from "@/assets/config.json"
import Webview, { type PageInfo } from "@/components/Webview.vue"
import { useI18n } from "@/utils/i18n"
import { MessageType } from "@/types"
import SidebarHome from "@/components/sidebar/SidebarHome.vue"
import Navbar from "@/components/sidebar/Navbar.vue"
import { FrameMessageType } from "@/types"

const { t } = useI18n()
const mobileUA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"

const mode = ref("")
const popularItems = reactive(config.data.popularSites)
const recentItems = reactive<{ url: string; title: string; icon: string }[]>([])
const currentTab = reactive({
  tabId: -1,
})
const defaultUA = ref(config.data.embedView.defaultUA)
const patchs = reactive(config.data.webviewPatchs)
const preloadUrls = reactive(config.data.loadCandidates)

const pages = reactive<{ url: string }[]>([])
const webviews = ref<InstanceType<typeof Webview>[]>([])
const webviewsAttr = computed(() => {
  return pages.map(({ url }) => {
    const patch = patchs.find((i) => new RegExp(i.re).test(url))
    return {
      url: url,
      preloadUrl: patch?.l || "",
      preloadCandidates: preloadUrls,
    }
  })
})
const active = ref(-1)
const pagesInfo = reactive<((PageInfo & { loading?: boolean }) | null)[]>([])
const hostUA = reactive<Record<string, number>>(config.data.embedView.hostUA)

const isPointerIn = ref(false)

const isMobileUA = computed(() => {
  if (active.value === -1) {
    return /Mobile/.test(defaultUA.value)
  }

  const url = pagesInfo[active.value]?.url || pages[active.value].url
  const u = new URL(url)

  if (u.host in hostUA) {
    return hostUA[u.host] === 1
  }

  const parent = Object.keys(hostUA).find((k) => {
    return u.host.endsWith(k)
  })

  console.log("parent", hostUA, u.host, parent)

  if (parent) {
    return hostUA[parent] === 1
  }

  return /Mobile/.test(defaultUA.value)
})

watch(isPointerIn, () => {
  updateNetRules()
})

onMounted(() => {
  const q = new URLSearchParams(location.search)
  mode.value = q.get("mode") || "sidepanel"
  // ua.value =
  //   "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"

  getLocal({
    popularSites: config.data.popularSites,
    sidebarRecentItems: [],
    webviewPatchs: config.data.webviewPatchs,
    loadCandidates: config.data.loadCandidates,
    presetEmbedView: config.data.embedView,
    customEmbedView: { defaultUA: "", hostUA: {} },
  }).then(
    ({
      popularSites,
      sidebarRecentItems,
      webviewPatchs,
      loadCandidates,
      presetEmbedView,
      customEmbedView,
    }) => {
      if (popularSites) {
        popularItems.splice(0, popularItems.length, ...popularSites)
      }
      if (sidebarRecentItems) {
        recentItems.splice(0, recentItems.length, ...sidebarRecentItems)
      }
      if (webviewPatchs) {
        patchs.splice(0, patchs.length, ...webviewPatchs)
      }
      if (loadCandidates) {
        preloadUrls.splice(0, preloadUrls.length, ...loadCandidates)
      }
      defaultUA.value = customEmbedView.defaultUA || presetEmbedView.defaultUA

      Object.entries({
        ...presetEmbedView.hostUA,
        ...customEmbedView.hostUA,
      }).map(([k, v]) => {
        hostUA[k] = v
      })
    }
  )

  getSession({
    sidebarInitUrl: {} as Record<string, string>,
  }).then(({ sidebarInitUrl }) => {
    console.log("[sidebar]", sidebarInitUrl, mode.value)
    const url = sidebarInitUrl?.[mode.value]
    if (url && !isProtectedUrl(url)) {
      go(url)
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

async function handleMessage(message: any) {
  switch (message.type) {
    case MessageType.openInSidebar:
      const url = message.url
      if (message.tabId == currentTab.tabId && !isProtectedUrl(url)) {
        go(url)
      }
      break
  }
}

function handlePageLoad(i: number) {
  pagesInfo[i] = { ...pagesInfo[i]!, loading: true }
}

async function handlePageLoaded(i: number, pageInfo: PageInfo) {
  pagesInfo[i] = { ...pageInfo, loading: false }

  if (mode.value === "content") {
    chrome.runtime.sendMessage({
      type: MessageType.registerContentSidebar,
      pages: pages,
    })
  }

  const { sidebarRecentItems } = await getLocal({
    sidebarRecentItems: [] as PageInfo[],
  })

  const index = sidebarRecentItems.findIndex((i) => i.url === pageInfo.url)
  if (index !== -1) {
    sidebarRecentItems.splice(index, 1)
  }
  sidebarRecentItems.unshift(pageInfo)
  sidebarRecentItems.splice(36)
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

function go(link: string) {
  const len = pages.push({ url: link })
  active.value = len - 1
}

function goBack() {
  const webview = webviews.value[active.value]
  webview?.goBack()
}

function goForward() {
  const webview = webviews.value[active.value]
  webview?.goForward()
}

function reload() {
  const webview = webviews.value[active.value]
  webview?.reload()
}

function closeWebview(index: number) {
  pages.splice(index, 1)
  pagesInfo.splice(index, 1)
  if (active.value > pages.length - 1) {
    active.value = pages.length - 1
  }
}

function collapseSidebar() {
  if (mode.value == "content") {
    parent.postMessage({ type: FrameMessageType.collapseSidebar }, "*")
  }
}

function closeSidebar() {
  if (mode.value == "content") {
    parent.postMessage({ type: FrameMessageType.closeSidebar }, "*")
  } else {
    window.close()
  }
}

async function toggleMobileUA() {
  if (active.value === -1) {
    defaultUA.value = isMobileUA.value ? "" : mobileUA
    return
  }

  const url = pagesInfo[active.value]?.url || pages[active.value].url
  const u = new URL(url)
  hostUA[u.host] = isMobileUA.value ? 0 : 1

  await updateNetRules()
  reload()
}

async function updateNetRules() {
  console.log("isPointerIn", defaultUA.value)
  const tabId = currentTab.tabId
  const extId = chrome.runtime.id

  await updateFrameNetRules({
    id: 2,
    ua: defaultUA.value,
    tabIds: [tabId],
    enabled: isPointerIn.value,
  })

  const mobileHosts = ["mobile.ziziyi.com"]
  const desktopHosts = ["desktop.ziziyi.com"]
  Object.entries(hostUA).forEach(([k, v]) => {
    if (v === 1) {
      mobileHosts.push(k)
    } else {
      desktopHosts.push(k)
    }
  })

  await updateUANetRules({
    id: 3,
    ua: mobileUA,
    requestDomains: mobileHosts,
    tabIds: [tabId],
    enabled: isPointerIn.value,
  })
  await updateUANetRules({
    id: 4,
    ua: navigator.userAgent,
    requestDomains: desktopHosts,
    tabIds: [tabId],
    enabled: isPointerIn.value,
  })
}

let timer = 0

function handlePointerEnter() {
  isPointerIn.value = true
  clearTimeout(timer)
}

function handlePointerLeave() {
  timer = window.setTimeout(() => {
    isPointerIn.value = false
  }, 350)
}
</script>

<template>
  <div
    class="w-full h-screen flex flex-col"
    @pointerenter="handlePointerEnter"
    @pointerleave="handlePointerLeave"
  >
    <Navbar
      :active="active"
      :pages="pages"
      :pagesInfo="pagesInfo"
      :isMobileUA="isMobileUA"
      :isPointerIn="isPointerIn"
      :closeWebview="closeWebview"
      :reload="reload"
      :toggleMobileUA="toggleMobileUA"
      :collapseSidebar="mode == 'content' ? collapseSidebar : undefined"
      :closeSidebar="mode == 'content' ? closeSidebar : undefined"
      @switch="active = $event"
      @drop="go"
    />

    <div :class="['w-full h-full', { hidden: active != -1 }]">
      <SidebarHome
        :recentItems="recentItems"
        :popularItems="popularItems"
        @go="go"
        @remove-recent-item="removeRecentItem"
      />
    </div>

    <div
      v-for="(attr, i) of webviewsAttr"
      :class="['w-full h-full overflow-hidden', { hidden: active != i }]"
    >
      <Webview
        ref="webviews"
        :key="i"
        :url="attr.url"
        :ua="defaultUA"
        :preload-url="attr.preloadUrl"
        :preload-candidates="attr.preloadCandidates"
        @load="handlePageLoad(i)"
        @loaded="(info) => handlePageLoaded(i, info)"
      />
    </div>
  </div>

  <!-- <LoadingBar /> -->
</template>

<style scoped></style>
