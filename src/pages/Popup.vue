<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, reactive, watch } from "vue"
import { emptyTab, checkContent, getStoreUrl, getLocal } from "@/utils/ext"
import { pipWindow } from "@/store"
import { MessageType } from "@/types"
import { useI18n } from "@/utils/i18n"
import config from "@/assets/config.json"
import { defaultSidebarPath } from "@/manifest"
// import { sitesConfig as chatDocsSites } from "@/components/chatdocs/chat"
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
import IconClose from "@/components/icons/IconClose.vue"
import IconSplitscreenRight from "@/components/icons/IconSplitscreenRight.vue"

const { t } = useI18n()

const activeTab = ref<chrome.tabs.Tab>(emptyTab)
const manifest = reactive(chrome.runtime.getManifest())
const avaiable = ref(false)
const popularItems = reactive(config.data.popularSites)
const keyboard = reactive({
  ctrl: false,
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
    console.log("pip window tabs: ", id)
    if (id) {
      const tabs = await chrome.tabs.query({ windowId: id })
      if (tabs && tabs.length == 1) {
        pipWindow.tab = tabs[0]
      }
      const win = await chrome.windows.get(id)
      pipWindow.windowsWindow = win
      return
    }
    pipWindow.tab = null
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

  getLocal({ pipWindowId: null, popularSites: config.data.popularSites }).then(
    ({ pipWindowId: id, popularSites }) => {
      if (id) {
        pipWindow.id = id
      }
      if (Array.isArray(popularSites)) {
        popularItems.splice(0, popularItems.length, ...popularSites)
      }
    }
  )

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
    handleWriteHtml()
  }
  if (e.code == "Backslash" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    handleOpenSidebar()
  }

  if (e.code == "ControlLeft" || e.code == "ControlRight") {
    keyboard.ctrl = true
  }
}

function hanldeKeyup(e: KeyboardEvent) {
  if (e.code == "ControlLeft" || e.code == "ControlRight") {
    keyboard.ctrl = false
  }
}

const handleLocalChange = (changes: {
  [key: string]: chrome.storage.StorageChange
}) => {
  if (changes.pipWindowId) {
    pipWindow.id = changes.pipWindowId.newValue
  }
}

async function handleWriteHtml() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const tab = tabs[0]
  if (tab) {
    chrome.tabs.sendMessage(tab.id!, {
      type: "pip",
      options: {
        url: tab.url,
        mode: "write-html",
      },
    })
  }
}

async function handleOpenSidebar(url: string = "") {
  const path = defaultSidebarPath + "?url=" + encodeURIComponent(url)
  await chrome.sidePanel.setOptions({ path })
  const win = await chrome.windows.getCurrent()
  await chrome.sidePanel.open({ windowId: win.id! })
  window.close()
}

async function handleClickLaunch(url: string) {
  console.log(activeTab.value)
  await chrome.runtime.sendMessage({
    type: "bg-pip-launch",
    url,
  })
  window.close()
}

function feedback() {
  open("https://tawk.to/anythingcopilot", "_blank")
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
  open("https://ziziyi.com/copilot", "_blank")
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
      <div class="mr-auto">
        <span class="font-bold opacity-50" @click="goHome">
          Anything Copilot
        </span>
        <span class="mx-2 text-sm opacity-50">{{ manifest.version }}</span>
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
        'flex gap-1 items-center text-sm my-2 px-2',
        {
          'text-rose-800': !avaiable,
        },
      ]"
    >
      <div
        v-if="avaiable"
        class="w-4 h-4 rounded"
        :style="{
          background:
            '#8882 center / contain url(' + activeTab?.favIconUrl + ')',
        }"
      ></div>
      <IconGppMaybe v-else class="w-4 h-4" />
      <div v-if="avaiable" class="truncate">{{ host }}</div>
      <div v-else class="truncate">{{ t("protectedTabTips") }}</div>
    </div>

    <div
      :class="[
        'flex flex-col gap-3 *:px-3 *:py-1',
        '*:flex *:items-center *:gap-2 *:rounded-md',
      ]"
    >
      <button
        v-if="!pipWindow.tab"
        :disabled="!avaiable"
        class="hover:bg-background-mute bg-background-soft disabled:bg-background-soft disabled:opacity-65"
        @click="handleWriteHtml"
        :title="t('openInPip')"
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
        class="hover:bg-background-mute bg-background-soft"
        @click="() => handleOpenSidebar(activeTab.url)"
        :title="t('openInSidebar')"
      >
        <IconSplitscreenRight class="size-8 shrink-0 scale-95" />
        <div class="flex items-center justify-between flex-1 w-2/3 gap-2">
          <span class="text-sm font-bold leading-4 truncate">
            {{ t("openInSidebar") }}
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
        <button
          class="flex flex-col items-center p-2 bg-background-soft rounded"
        >
          <IconNoteStack class="size-7" />
          <div class="text-xs">Chat Doc</div>
        </button>
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
      <button
        v-for="item of popularItems"
        class="group w-[58px] shrink-0 relative flex flex-col items-center rounded-lg px-2 py-3 bg-background-soft"
        @click="
          () =>
            keyboard.ctrl
              ? handleOpenSidebar(item.url)
              : handleClickLaunch(item.url)
        "
      >
        <div
          class="size-6 rounded"
          :style="{
            background: 'center / contain url(' + item.icon + ')',
          }"
        ></div>
        <div
          class="text-xs h-6 leading-3 line-clamp-2 flex flex-col justify-center"
        >
          <div>{{ item.title }}</div>
        </div>

        <IconAmpStories
          v-if="!keyboard.ctrl"
          class="size-3 absolute top-1 right-1 opacity-0 group-hover:opacity-65"
        />
        <IconSplitscreenRight
          v-else
          class="size-3 absolute top-1 right-1 opacity-0 group-hover:opacity-65"
        />
      </button>
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
