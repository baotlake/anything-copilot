<script setup lang="ts">
import { debounce } from "lodash-es"
import { onMounted, onUnmounted, ref, watch } from "vue"
import { getLocal } from "@/utils/ext"
import IconClose from "@/components/icons/IconClose.vue"
import IconSplitscreenRight from "@/components/icons/IconSplitscreenRight.vue"
import PageScrollbar from "./PageScrollbar.vue"
import { MessageType } from "@/types"
import { autoPointerCapture } from "@/utils/dom"

const props = defineProps<{
  hidden?: boolean
}>()
const emit = defineEmits(["close", "hide"])

const sidebarHtml = chrome.runtime.getURL("sidebar.html")
const sidebarUrl = sidebarHtml + "?mode=content"
const logoUrl = chrome.runtime.getURL("/logo.svg")
let sheet: CSSStyleSheet | null = null
let invisibleTimer = 0

const width = ref(360)
const invisible = ref(false)

const pointermove = (e: PointerEvent) => {
  if (e.buttons) {
    width.value -= e.movementX
  }
}

function updatePageStyle(width = 0) {
  if (!sheet) {
    sheet = new CSSStyleSheet()
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
  }
  const style =
    `html::-webkit-scrollbar { display: none; } ` +
    `html { max-width: calc(100% - ${width}px); }`
  sheet.replace(style)
  sheet.disabled = false
}

function disablePageStyle() {
  if (sheet) {
    sheet.disabled = true
  }
}

function handleKeydown(e: KeyboardEvent) {
  // console.log(e.key, e)
  if (e.key == "Escape" && !invisible.value) {
    invisibleTimer = window.setTimeout(() => {
      invisible.value = true
    }, 300)
  }
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.key == "Escape") {
    window.clearTimeout(invisibleTimer)
    invisible.value = false
  }
}

watch(
  width,
  debounce((value) => {
    updatePageStyle(value)
    chrome.storage.local.set({
      contentSidebarWidth: value,
    })
  }, 300)
)

watch(
  () => props.hidden,
  () => {
    if (props.hidden) {
      disablePageStyle()
    } else {
      updatePageStyle(width.value)
    }
  }
)

onMounted(() => {
  getLocal({ contentSidebarWidth: 360 }).then((data) => {
    width.value = data.contentSidebarWidth
  })
  updatePageStyle(width.value)
  window.addEventListener("keydown", handleKeydown)
  window.addEventListener("keyup", handleKeyUp)
  chrome.runtime.sendMessage({
    type: MessageType.registerContentSidebar,
  })
})

onUnmounted(() => {
  disablePageStyle()
  window.removeEventListener("keydown", handleKeydown)
  window.removeEventListener("keyup", handleKeyUp)
  chrome.runtime.sendMessage({
    type: MessageType.unregisterContentSidebar,
  })
})
</script>

<template>
  <div
    :class="[
      'fixed flex right-0 top-0 h-screen min-w-80 max-w-[80vw] z-[999999]',
      { invisible: invisible || props.hidden },
    ]"
    :style="{ width: `${width}px` }"
  >
    <PageScrollbar class="ml-[-2px]" />

    <div class="relative flex-1 flex flex-col bg-background">
      <div
        class="absolute h-full w-1 top-0 left-[-2px] cursor-ew-resize"
        @pointerdown="autoPointerCapture"
        @pointermove="pointermove"
      ></div>
      <div class="flex gap-2 items-center justify-between h-9 px-2">
        <button
          @click=""
          class="size-6 flex items-center justify-center mr-auto"
        >
          <img class="size-4" :src="logoUrl" />
        </button>
        <button
          @click="emit('hide')"
          class="size-6 rounded-full hover:bg-background-soft flex items-center justify-center"
        >
          <IconSplitscreenRight class="size-4 scale-95" />
        </button>
        <button
          @click="emit('close')"
          class="size-6 rounded-full hover:bg-background-soft flex items-center justify-center"
        >
          <IconClose class="size-4" />
        </button>
      </div>
      <iframe class="w-full h-full flex-1" :src="sidebarUrl"></iframe>
    </div>
  </div>
</template>

<style scoped></style>
