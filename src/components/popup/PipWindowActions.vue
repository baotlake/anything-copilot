<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue"
import { pipWindow } from "@/store"
import IconHide from "@/components/icons/IconHide.vue"
import IconArrowCircleRight from "@/components/icons/IconArrowCircleRight.vue"
import IconClose from "@/components/icons/IconClose.vue"
import { MessageType } from "@/types"

const handleLocalChange = (changes: {
  [key: string]: chrome.storage.StorageChange
}) => {
  if (changes.pipWindowId) {
    pipWindow.id = changes.pipWindowId.newValue
  }
}

watch(
  () => pipWindow.id,
  async (id) => {
    if (id) {
      const tabs = await chrome.tabs.query({ windowId: id })
      console.log("pip window tabs: ", tabs, id)
      if (tabs && tabs.length == 1) {
        pipWindow.tab = tabs[0]
      }

      return
    }
    pipWindow.tab = null
  }
)

onMounted(() => {
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

async function handleUpdatePip(state: "normal" | "minimized") {
  await chrome.runtime.sendMessage({
    type: MessageType.updateWindow,
    options: {
      windowId: pipWindow.id,
      windowInfo: {
        state,
      },
    },
  })
}

async function closePip() {
  await chrome.runtime.sendMessage({
    type: MessageType.updateWindow,
    options: {
      windowId: pipWindow.id,
      windowInfo: {
        state: "normal",
      },
    },
  })

  await chrome.runtime.sendMessage({
    type: MessageType.removeWindow,
    options: {
      windowId: pipWindow.id,
    },
  })
}
</script>

<template>
  <div v-if="pipWindow.tab && pipWindow.tab.id">
    <div class="text-sm flex items-center truncate mt-6">
      <span
        class="w-4 h-4 inline-block mr-2 rounded"
        :style="{
          background:
            '#8882 center / contain url(' + pipWindow.tab?.favIconUrl + ')',
        }"
      ></span>
      <span>{{ pipWindow.tab?.title }}</span>
    </div>
    <div class="flex gap-2">
      <button
        class="primary-btn flex items-center mt-2 rounded-lg p-2 px-3"
        @click="handleUpdatePip('minimized')"
      >
        <IconHide />
      </button>
      <button
        class="primary-btn flex items-center mt-2 rounded-lg p-2 px-3"
        @click="handleUpdatePip('normal')"
      >
        <IconArrowCircleRight />
      </button>
      <button
        class="primary-btn flex items-center mt-2 rounded-lg p-2 px-3"
        @click="closePip"
      >
        <IconClose />
      </button>
    </div>
  </div>
</template>

<style scoped>
.primary-btn {
  background: var(--color-background-soft);
}
.primary-btn:hover {
  background: var(--color-background-mute);
}
</style>
