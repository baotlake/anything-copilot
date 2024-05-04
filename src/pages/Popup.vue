<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, reactive, watch } from "vue"
import { emptyTab, checkContent, getStoreUrl, getLocal } from "@/utils/ext"
import { pipWindow } from "@/store/popup"
import { MessageType } from "@/types"
import { useI18n } from "@/utils/i18n"
import config from "@/assets/config.json"
import PipWindowActions from "@/components/popup/PipWindowActions.vue"
import IconThumbUp from "@/components/icons/IconThumbUp.vue"
import IconThumbDown from "@/components/icons/IconThumbDown.vue"
import IconGithub from "@/components/icons/IconGithub.vue"
import IconDiscord from "@/components/icons/IconDiscord.vue"
import IconXLogo from "@/components/icons/IconXLogo.vue"
import IconNoteStack from "@/components/icons/IconNoteStack.vue"
import IconHelp from "@/components/icons/IconHelp.vue"
import IconAmpStories from "@/components/icons/IconAmpStories.vue"
import IconGppMaybe from "@/components/icons/IconGppMaybe.vue"
import IconHide from "@/components/icons/IconHide.vue"
import IconArrowCircleRight from "@/components/icons/IconArrowCircleRight.vue"
import IconSplitscreenRight from "@/components/icons/IconSplitscreenRight.vue"
import IconLogo from "@/components/icons/IconLogo.vue"
import SiteButton from "@/components/SiteButton.vue"
import { getIsEdge, openSidebar } from "@/utils/ext"
import { handleImgError } from "@/utils/dom"
import { homeUrl, feedbackUrl } from "@/utils/const"

const globeImg = chrome.runtime.getURL("img/globe.svg")

const isEdge = getIsEdge()
const { t } = useI18n()
const activeTab = ref<chrome.tabs.Tab>(emptyTab)
const manifest = reactive(chrome.runtime.getManifest())
const avaiable = ref(false)
const popularItems = reactive(config.data.popularSites)
const keyboard = reactive({
  ctrl: false,
  shift: false,
})
const horizontalScroller = ref<HTMLElement | null>(null)

const host = computed({
  get: () => {
    if (!activeTab.value.url) return ""
    const u = new URL(activeTab.value.url)
    return u.host
  },
  set: () => {},
})

watch(
  () => pipWindow.id,
  async (id) => {
    if (id) {
      const win = await chrome.windows.get(id)
      pipWindow.windowsWindow = win
    } else {
      pipWindow.windowsWindow = null
    }
  }
)

watch(
  () => pipWindow.tabId,
  async (tabId) => {
    if (tabId) {
      const tab = await chrome.tabs.get(tabId)
      pipWindow.tab = tab
    } else {
      pipWindow.tab = null
    }
  }
)

onMounted(() => {
  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    console.log(tabs)
    if (tabs[0]) activeTab.value = tabs[0]

    checkContent(tabs[0].id!).then((value) => {
      avaiable.value = value
    })
  })

  getLocal({
    pipWindow: null as null | { windowId: number; tabId: number; icon: string },
    popularSites: config.data.popularSites,
  }).then(({ pipWindow: pip, popularSites }) => {
    if (pip) {
      pipWindow.id = pip.windowId
      pipWindow.tabId = pip.tabId
      pipWindow.icon = pip.icon
    }
    if (Array.isArray(popularSites)) {
      popularItems.splice(0, popularItems.length, ...popularSites)
    }
  })

  chrome.storage.local.onChanged.addListener(handleLocalChange)
  window.addEventListener("keydown", handleKeydown)
  window.addEventListener("keyup", hanldeKeyup)
})

onUnmounted(() => {
  chrome.storage.local.onChanged.removeListener(handleLocalChange)
  window.removeEventListener("keydown", handleKeydown)
  window.removeEventListener("keyup", hanldeKeyup)
})

function handleKeydown(e: KeyboardEvent) {
  if (e.code == "KeyP" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    handlePipPopup()
  }
  if (e.code == "Backslash" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    openSidebar({
      urls: [],
    }).then(() => close())
  }

  if (e.code == "ControlLeft" || e.code == "ControlRight") {
    keyboard.ctrl = true
  }
  if (e.code == "ShiftLeft" || e.code == "ShiftRight") {
    keyboard.shift = true
  }
}

function hanldeKeyup(e: KeyboardEvent) {
  if (e.code == "ControlLeft" || e.code == "ControlRight") {
    keyboard.ctrl = false
  }
  if (e.code == "ShiftLeft" || e.code == "ShiftRight") {
    keyboard.shift = false
  }
}

const handleLocalChange = (changes: {
  [key: string]: chrome.storage.StorageChange
}) => {
  if (changes.pipWindow) {
    pipWindow.id = changes.pipWindow.newValue.windowId
    pipWindow.tabId = changes.pipWindow.newValue.tabId
  }
}

async function handlePipPopup() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const tab = tabs[0]
  if (tab) {
    chrome.tabs.sendMessage(tab.id!, {
      type: MessageType.pip,
      options: {
        url: tab.url,
        mode: "write-html",
      },
    })
  }

  window.close()
}

function close() {
  window.close()
}

async function handleClickLaunch(url: string) {
  console.log(activeTab.value)
  await chrome.runtime.sendMessage({
    type: MessageType.bgPipLaunch,
    url,
  })
  window.close()
}

function feedback() {
  open(feedbackUrl, "_blank")
}
function fivestar() {
  open(
    getStoreUrl({
      id: chrome.runtime.id,
      name: "anything-copilot",
      reviews: true,
    })
  ),
    "_blank"
}

function goHome() {
  open(homeUrl, "_blank")
}

function showChatDocs() {
  const tabId = activeTab.value.id
  if (tabId) {
    chrome.tabs.sendMessage(tabId, {
      type: MessageType.showChatDocs,
    })
  }
}
</script>

<template>
  <main class="w-[300px] p-4 mx-auto bg-background">
    <div class="flex">
      <div
        class="mr-auto flex items-center gap-2 cursor-pointer"
        @click="goHome"
      >
        <IconLogo class="size-5" />
        <span class="font-bold opacity-65">Anything Copilot</span>
        <!-- <span class="mx-2 text-sm opacity-50">{{ manifest.version }}</span> -->
      </div>
      <div class="flex items-center gap-1">
        <button
          class="p-1 rounded-lg hover:text-rose-600 hover:bg-rose-600/20"
          @click="fivestar"
        >
          <IconThumbUp class="w-5 h-5 opacity-60" />
        </button>

        <button
          class="p-1 rounded-lg hover:text-blue-600 hover:bg-blue-600/20"
          @click="feedback"
        >
          <IconThumbDown class="w-5 h-5 opacity-60" />
        </button>
      </div>
    </div>

    <div
      :class="[
        'flex gap-2 items-center text-sm mt-6 my-2 px-0',
        {
          'text-rose-800': !avaiable,
        },
      ]"
    >
      <!-- <div
        v-if="avaiable"
        class="size-5"
        :style="{
          background: 'center / contain url(' + activeTab?.favIconUrl + ')',
        }"
      ></div> -->
      <img
        v-if="avaiable"
        class="size-5"
        loading="lazy"
        :src="activeTab?.favIconUrl || ''"
        :data-fallback="globeImg"
        @error="handleImgError"
      />
      <IconGppMaybe v-else class="size-5" />
      <div class="truncate">
        {{ avaiable ? host : t("protectedTabTips") }}
      </div>
    </div>

    <div
      :class="[
        'flex flex-col gap-3 *:px-3 *:py-1',
        '*:flex *:items-center *:gap-2 *:rounded-md',
      ]"
    >
      <button
        v-if="!(pipWindow.tab && pipWindow.windowsWindow)"
        class="hover:bg-background-mute bg-background-soft disabled:bg-background-soft disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!avaiable"
        :title="t('openInPip')"
        @click="handlePipPopup"
      >
        <IconAmpStories class="size-8 shrink-0" />
        <div class="flex items-center justify-between flex-1 w-2/3 gap-2">
          <span class="text-base font-bold leading-4 truncate">
            {{ t("openInPip") }}
          </span>
          <span class="text-xs">CTRL + P</span>
        </div>
      </button>

      <PipWindowActions v-else />

      <button
        class="hover:bg-background-mute bg-background-soft disabled:bg-background-soft disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isEdge && !avaiable"
        :title="t('openInSidebar')"
        @click="
        (e) => {
            openSidebar({
              urls: [activeTab.url!],
              sidePanel: !(isEdge || e.ctrlKey || e.metaKey),
              tab: activeTab,
            }).then(() => close())
          }
        "
      >
        <IconSplitscreenRight class="size-8 shrink-0 scale-95" />
        <div class="flex items-center justify-between flex-1 w-2/3 gap-2">
          <span class="text-base font-bold leading-4 truncate">
            {{ isEdge ? t("openSidebar") : t("openInSidebar") }}
          </span>
          <span class="text-xs">CTRL + \</span>
        </div>
      </button>
    </div>

    <div class="mt-6">
      <div class="my-3 flex items-center">
        <span class="mr-1">{{ t("newFeature") }}🎉</span>
      </div>

      <button class="flex items-center" @click="showChatDocs">
        <IconNoteStack class="size-9" />
        <div class="mx-2 text-left">
          <div class="text-sm">{{ t("chatDocsAddon") }}</div>
          <div class="text-xs">{{ t("chatDocsTips") }}</div>
        </div>
      </button>
    </div>

    <div v-if="false">
      <div>More Tools</div>
      <div class="flex gap-3">
        <button
          class="flex flex-col items-center p-2 bg-background-soft rounded"
        >
          <IconNoteStack class="size-7" />
          <div class="text-xs">Chat Doc</div>
        </button>
      </div>
    </div>

    <div class="text-sm mt-6">{{ t("popular") }}</div>
    <div
      ref="horizontalScroller"
      class="horizontal-scroller overflow-auto select-none flex gap-3 my-3"
      @wheel="(e) => horizontalScroller!.scrollLeft += e.deltaY"
      @pointermove="(e) => e.buttons && (horizontalScroller!.scrollLeft -= e.movementX)"
    >
      <SiteButton
        v-for="item of popularItems"
        :icon="item.icon"
        :title="item.title"
        :badge="keyboard.shift || (isEdge && !avaiable) ? 'popup' : 'sidebar'"
        :url="item.url"
        small
        @click="
          () => {
            if (keyboard.shift || (isEdge && !avaiable)) {
              return handleClickLaunch(item.url)
            }

            openSidebar({
              urls: [item.url],
              sidePanel: !(isEdge || keyboard.ctrl),
            }).then(() => close())
          }
        "
      />
    </div>

    <div class="mt-3 flex items-center justify-center opacity-60">
      <a
        class="px-1.5"
        href="https://github.com/baotlake/anything-copilot"
        target="_blank"
        ref="noreferrer"
      >
        <IconGithub class="w-[15px] h-[15px] text-[rgb(var(--fg-rgb))]" />
      </a>
      <a
        class="px-1.5"
        href="https://discord.gg/aYSxbF8em9"
        target="_blank"
        ref="noreferrer"
      >
        <IconDiscord class="w-[16px] h-[16px] text-[rgb(var(--fg-rgb))]" />
      </a>
      <a
        class="px-1.5"
        href="https://twitter.com/baotlake"
        target="_blank"
        ref="noreferrer"
      >
        <IconXLogo class="w-[12px] h-[12px] text-[rgb(var(--fg-rgb))]" />
      </a>
    </div>
  </main>
</template>

<style scoped>
.horizontal-scroller::-webkit-scrollbar {
  background: transparent;
  width: 8px;
  height: 8px;
}
.horizontal-scroller::-webkit-scrollbar-thumb {
  background: transparent;
  transition: all 0.3s;
}
.horizontal-scroller:hover::-webkit-scrollbar-thumb {
  border: 3px solid transparent;
  background-clip: content-box;
  @apply bg-foreground/10;
}
</style>
