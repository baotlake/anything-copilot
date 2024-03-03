<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue"
import { pipWindow } from "@/store"
import IconHide from "@/components/icons/IconHide.vue"
import IconArrowCircleRight from "@/components/icons/IconArrowCircleRight.vue"
import IconClose from "@/components/icons/IconClose.vue"
import { MessageType } from "@/types"

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
  <div class="justify-between border-2 border-solid border-background-mute">
    <div
      class="size-7 rounded mr-auto"
      :style="{
        background: `#8881 center / contain url('${pipWindow.tab?.favIconUrl}')`,
      }"
    ></div>

    <button
      v-if="pipWindow.windowsWindow?.state === 'normal'"
      class="bg-background-soft hover:bg-background-mute rounded-full size-8 p-1 flex items-center justify-center"
      @click="handleUpdatePip('minimized')"
    >
      <IconHide class="size-5" />
    </button>
    <button
      v-if="pipWindow.windowsWindow?.state === 'minimized'"
      class="bg-background-soft hover:bg-background-mute rounded-full size-8 p-1 flex items-center justify-center"
      @click="handleUpdatePip('normal')"
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
