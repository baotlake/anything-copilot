<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue"
import { pipWindow } from "@/store/popup"
import IconHide from "@/components/icons/IconHide.vue"
import IconArrowCircleRight from "@/components/icons/IconArrowCircleRight.vue"
import IconClose from "@/components/icons/IconClose.vue"
import { MessageType, ServiceFunc } from "@/types"
import { computed } from "vue"
import { messageInvoke } from "@/utils/invoke"
import { handleImgError } from "@/utils/dom"

const globeImg = chrome.runtime.getURL("img/globe.svg")

const isMinimized = computed(() => {
  if (pipWindow.windowsWindow) {
    const { width, height } = pipWindow.windowsWindow
    return width! < 300 && height! < 100
  }
  return false
})

async function toggleMinimize() {
  await messageInvoke.invoke({
    tabId: pipWindow.tabId,
    func: ServiceFunc.toggleMinimize,
    args: [],
  })

  if (pipWindow.id) {
    const win = await chrome.windows.get(pipWindow.id)
    pipWindow.windowsWindow = win
  }
}

async function closePip() {
  pipWindow.windowsWindow = null

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
  <div class="justify-between border-2 border-solid border-background-mute">
    <img
      :src="pipWindow.icon"
      :data-fallback="globeImg"
      class="size-7 rounded mr-auto"
      loading="lazy"
      @error="handleImgError"
    />

    <button
      v-if="!isMinimized"
      class="bg-background-soft hover:bg-background-mute rounded-full size-8 p-1 flex items-center justify-center"
      @click="toggleMinimize"
    >
      <IconHide class="size-5" />
    </button>
    <button
      v-else
      class="bg-background-soft hover:bg-background-mute rounded-full size-8 p-1 flex items-center justify-center"
      @click="toggleMinimize"
    >
      <IconArrowCircleRight class="size-5" />
    </button>
    <button
      class="bg-background-soft hover:bg-background-mute rounded-full size-8 p-1 flex items-center justify-center"
      @click="closePip"
    >
      <IconClose class="size-5" />
    </button>
  </div>
</template>

<style scoped></style>
