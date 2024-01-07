<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, reactive, watch } from "vue"
import { emptyTab, checkContent, getStoreUrl } from "@/utils/ext"
import { items, pipWindow } from "@/store"
import { MessageType } from "@/types"
// import { sitesConfig as chatDocsSites } from "@/components/chatdocs/chat"
import PipWindowActions from "@/components/popup/PipWindowActions.vue"
import IconThumbUp from "@/components/icons/IconThumbUp.vue"
import IconThumbDown from "@/components/icons/IconThumbDown.vue"
import IconGithub from "@/components/icons/IconGithub.vue"
import IconDiscord from "@/components/icons/IconDiscord.vue"
import IconXLogo from "@/components/icons/IconXLogo.vue"
import IconNoteStack from "@/components/icons/IconNoteStack.vue"
import IconHelp from "@/components/icons/IconHelp.vue"

import { useI18n } from "@/utils/i18n"

const { t } = useI18n()

const activeTab = ref<chrome.tabs.Tab>(emptyTab)
const manifest = reactive(chrome.runtime.getManifest())
const avaiable = ref(false)

const host = computed({
  get: () => {
    if (!activeTab.value.url) return ""
    const u = new URL(activeTab.value.url)
    return u.host
  },
  set: () => {},
})

// const chatDocs = computed(() => {
//   const url = activeTab.value.url
//   if (url) {
//     const u = new URL(url)
//     return chatDocsSites.some(
//       (site) => site.host == u.host && site.path.test(u.pathname)
//     )
//   }
//   return false
// })

watch(
  () => pipWindow.id,
  async (id) => {
    console.log("pip window tabs: ", id)
    if (id) {
      const tabs = await chrome.tabs.query({ windowId: id })
      if (tabs && tabs.length == 1) {
        pipWindow.tab = tabs[0]
      }

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

  chrome.storage.local
    .get({ pipWindowId: null })
    .then(({ pipWindowId: id }) => {
      if (id) {
        pipWindow.id = id
      }
    })

  chrome.storage.local.onChanged.addListener(handleLocalChange)
})

onUnmounted(() => {
  chrome.storage.local.onChanged.removeListener(handleLocalChange)
})

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

async function handleClickLaunch(url: string) {
  console.log(activeTab.value)
  chrome.runtime.sendMessage({
    type: "bg-pip-launch",
    url,
  })
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
        <span class="font-bold opacity-50">Anything Copilot</span>
        <span class="mx-2 text-sm opacity-50">{{ manifest.version }}</span>
      </div>
      <div class="flex items-center gap-1">
        <button
          class="p-1 rounded-lg hover:animate-ping hover:text-rose-600 hover:bg-rose-600/20"
          @click="fivestar"
        >
          <IconThumbUp class="w-5 h-5 opacity-60" />
        </button>

        <button
          class="p-1 rounded-lg hover:animate-bounce hover:text-blue-600 hover:bg-blue-600/20"
          @click="feedback"
        >
          <IconThumbDown class="w-5 h-5 opacity-60" />
        </button>
      </div>
    </div>

    <PipWindowActions v-if="pipWindow.tab && pipWindow.tab.id" />

    <template v-else>
      <div class="flex items-center text-sm mt-6">
        <span
          class="w-4 h-4 inline-block mr-2 rounded"
          :style="{
            background:
              '#8882 center / contain url(' + activeTab?.favIconUrl + ')',
          }"
        ></span>
        <span class="inline-block truncate">{{ host }}</span>
      </div>

      <button
        :class="[
          'w-full bg-sky-800 text-white flex items-center mt-2 rounded-lg p-2 px-3',
          {
            'cursor-not-allowed': !avaiable,
          },
        ]"
        @click="handleWriteHtml"
      >
        <span class="text-base">{{ t("openInPip") }}</span>
      </button>

      <div v-if="!avaiable" class="text-sm leading-4 text-rose-800">
        {{ t("protectedTabTips") }}
      </div>
    </template>

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

    <div class="text-sm mt-6">{{ t("other") }}</div>
    <button
      v-for="item of items"
      class="primary-btn w-full flex items-center mt-3 rounded-lg p-2 px-3"
      @click="handleClickLaunch(item.url)"
    >
      <span
        class="w-5 h-5 inline-block mr-3 rounded"
        :style="{
          background: 'center / contain url(' + item.img + ')',
        }"
      >
      </span>
      <span class="text-base">{{ item.title }}</span>
    </button>

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
.primary-btn {
  background: var(--color-background-soft);
}
.primary-btn:hover {
  background: var(--color-background-mute);
}
</style>
