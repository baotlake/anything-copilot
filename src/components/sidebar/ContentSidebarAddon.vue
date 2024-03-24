<script setup lang="ts">
import { ref } from "vue"
import ContentSidebar from "./ContentSidebar.vue"
import { sidebarAddon } from "@/store/content"
import { autoPointerCapture } from "@/utils/dom"
const logoUrl = chrome.runtime.getURL("/logo.svg")

const top = ref(72)

function handlePointerMove(e: PointerEvent) {
  if (e.buttons) {
    const value = top.value + e.movementY
    top.value = Math.max(12, Math.min(window.innerHeight - 60, value))
  }
}
</script>

<template>
  <ContentSidebar
    v-if="sidebarAddon.visible"
    :hidden="sidebarAddon.hidden" 
    @close="sidebarAddon.visible = false"
    @hide="sidebarAddon.hidden = true"
  />

  <div
    v-if="sidebarAddon.hidden"
    :class="[
      'fixed top-16 right-0 p-1.5 bg-background/65 backdrop-blur-md cursor-pointer',
      'rounded-s shadow-lg z-[999999] hover:bg-background-mute/65',
    ]"
    :style="{ top: top + 'px' }"
    @pointerdown="autoPointerCapture"
    @pointermove="handlePointerMove"
    @click="sidebarAddon.hidden = false"
  >
    <img :src="logoUrl" class="size-4 pointer-events-none select-none" />
  </div>
</template>

<style scoped></style>