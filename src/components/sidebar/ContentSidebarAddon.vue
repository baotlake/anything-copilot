<script setup lang="ts">
import { ref, onMounted } from "vue"
import ContentSidebar from "./ContentSidebar.vue"
import { sidebarAddon } from "@/store/content"
import { autoPointerCapture } from "@/utils/dom"
import { messageInvoke } from "@/utils/invoke"
import { ServiceFunc } from "@/types"
const logoUrl = chrome.runtime.getURL("/logo.svg")

const top = ref(72)

function handlePointerMove(e: PointerEvent) {
  if (e.buttons) {
    const value = top.value + e.movementY
    top.value = Math.max(12, Math.min(window.innerHeight - 60, value))
  }
}

onMounted(() => {
  messageInvoke.register(
    ServiceFunc.toggleContentSidebar,
    async ({ visible, collapse }: { visible: boolean; collapse?: boolean }) => {
      sidebarAddon.visible = visible ?? !sidebarAddon.visible
      sidebarAddon.collapse = collapse ?? sidebarAddon.collapse

      // how to

      awai messageInvoke.invoke({
        key: ServiceFunc.waitSidebar,
        func: ServiceFunc.waitSidebar,
        args: [],
        timeout: 300,
      })
    }
  )
})
</script>

<template>
  <ContentSidebar
    v-if="sidebarAddon.visible"
    :hidden="sidebarAddon.collapse"
    @close="sidebarAddon.visible = false"
    @hide="sidebarAddon.collapse = true"
  />

  <div
    v-if="sidebarAddon.collapse"
    :class="[
      'fixed top-16 right-0 p-1.5 bg-background/65 backdrop-blur-md cursor-pointer',
      'rounded-s shadow-lg z-[999999] hover:bg-background-mute/65',
    ]"
    :style="{ top: top + 'px' }"
    @pointerdown="autoPointerCapture"
    @pointermove="handlePointerMove"
    @click="sidebarAddon.collapse = false"
  >
    <img :src="logoUrl" class="size-4 pointer-events-none select-none" />
  </div>
</template>

<style scoped></style>
