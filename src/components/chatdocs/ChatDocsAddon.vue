<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, computed } from "vue"
import IconNoteStackAdd from "@/components/icons/IconNoteStackAdd.vue"
import IconClose from "@/components/icons/IconClose.vue"
import { chatDocsPanel, docsAddon } from "@/store/content"
import ChatDocsPanel from "@/components/chatdocs/ChatDocsPanel.vue"
import { watchEffect } from "vue"
import { useI18n } from "@/utils/i18n"
import { getDocItem, devConfig, type SiteConfig } from "./helper"
import config from "@/assets/config.json"
import { getLocal } from "@/utils/ext"
import { chatDocPrompt } from "@/utils/prompt"
import { autoPointerCapture } from "@/utils/dom"

const { t } = useI18n()
const logoUrl = chrome.runtime.getURL("/logo.svg")
const div = ref<HTMLDivElement>()
const chatDocsDiv = ref<HTMLDivElement>()
const position = reactive({
  valid: false,
  rect: new DOMRect(0, 0, 0, 0),
  tx: 0,
  ty: 0,
})

const siteConfig: SiteConfig = reactive({
  prompt: chatDocPrompt,
  maxInput: 3000,
  maxInputType: "token",
  maxRuns: 10,
  selector: null,
})

let timer = 0

watchEffect(() => {
  const { valid, rect, tx, ty } = position
  const div = chatDocsDiv.value
  if (div && valid && chatDocsPanel.visible) {
    div.style.top = rect.top + "px"
    div.style.left = rect.left + "px"
    div.style.transform = `translate(${tx}px, ${ty}px)`
  }
})

function onDragOver(e: DragEvent) {
  if (!siteConfig.selector) return
  docsAddon.visible = true
  clearTimeout(timer)
  timer = window.setTimeout(() => (docsAddon.visible = false), 180)
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  docsAddon.active = false
  docsAddon.visible = false

  if (e.dataTransfer) {
    const items = await getDocItem(e.dataTransfer.items)

    chatDocsPanel.visible = true
    chatDocsPanel.inputs = items

    console.log("items  _> ", items)
  }

  const files = e.dataTransfer?.files
  const items = e.dataTransfer?.items
  const types = e.dataTransfer?.types

  console.log("files: ", files, files?.length)
  console.log("items: ", items, items?.length)
  console.log("types: ", types, items?.length)
}

function handlePointerMove(e: PointerEvent) {
  const div = chatDocsDiv.value
  if (e.buttons == 1 && div) {
    if (!position.valid) {
      const rect = div.getBoundingClientRect()
      position.rect = rect
      position.valid = true
      div.style.top = rect.top + "px"
      div.style.left = rect.left + "px"
      div.style.transform = "translate(0px, 0px)"
    }

    position.tx += e.movementX
    position.ty += e.movementY
    // div.style.transform = `translate(${position.tx}px, ${position.ty}px)`
  }
}

function adjustPosition() {
  const div = chatDocsDiv.value
  if (div) {
    const rect = div.getBoundingClientRect()
    const dx =
      rect.left < 0
        ? -rect.left
        : rect.right > innerWidth
        ? innerWidth - rect.right
        : 0
    const dy =
      rect.top < 0
        ? -rect.top
        : rect.bottom > innerHeight
        ? innerHeight - rect.bottom
        : 0
    position.tx += dx
    position.ty += dy
    // div.style.transform = `translate(${position.tx}px, ${position.ty}px)`
  }
}

onMounted(() => {
  const doc = div.value?.ownerDocument || document
  doc.addEventListener("dragover", onDragOver, true)
  doc.defaultView?.addEventListener("resize", adjustPosition)
  const defaultChatDocSites = config.data.chatDocSites

  getLocal({
    chatDocSites: defaultChatDocSites,
  }).then(({ chatDocSites }) => {
    chatDocSites.push(devConfig)
    const { host, pathname } = doc.location

    const matchConfig = chatDocSites.find(
      (s) => s.host == host && new RegExp(s.path).test(pathname)
    )
    if (matchConfig) {
      siteConfig.maxInput =
        matchConfig.maxInputToken || matchConfig.maxInputLength
      siteConfig.maxInputType = matchConfig.maxInputToken ? "token" : "char"
      siteConfig.selector = matchConfig.selector
    }

    console.log("chatdoc config: ", matchConfig, chatDocSites)
  })
})

onUnmounted(() => {
  const doc = div.value?.ownerDocument || document
  doc.removeEventListener("dragover", onDragOver, true)
  doc.removeEventListener("resize", adjustPosition)
  doc.defaultView?.removeEventListener("resize", adjustPosition)
})
</script>

<template>
  <div ref="div" class="hidden"></div>
  <div
    v-if="docsAddon.visible"
    :class="[
      'fixed mt-10 top-0 p-6 border-2 rounded-lg bg-background z-[9999999]',
      'shadow-lg left-1/2 -translate-x-1/2 w-max transition-all',
      {
        'border-primary/50': !docsAddon.active && docsAddon.visible,
        'border-primary scale-105': docsAddon.active,
      },
    ]"
    @dragenter="docsAddon.active = true"
    @dragleave="docsAddon.active = false"
    @dragover="(e) => e.preventDefault()"
    @drop="onDrop"
  >
    <div class="pointer-events-none">
      <div class="flex items-center gap-2">
        <IconNoteStackAdd class="w-8 h-8" />
        <div class="text-xl font-bold">Anything Copilot</div>
      </div>
      <p class="text-center text-sm mt-2">{{ t("chatDocs.supportFormat") }}</p>
      <div :class="['absolute text-xs flex items-center bottom-2 right-2']">
        <img :src="logoUrl" class="w-3 h-3" />
      </div>
    </div>
  </div>

  <div
    v-if="chatDocsPanel.visible"
    ref="chatDocsDiv"
    :class="[
      'fixed flex flex-col w-96 max-w-full h-[600px] max-h-full border rounded-lg',
      'z-[9999] border-foreground/10 bg-background shadow-lg dark:border-2',
      {
        'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2': !position.valid,
      },
    ]"
  >
    <div
      class="flex items-center px-4 pt-4 pb-1 select-none"
      @pointerdown="autoPointerCapture"
      @pointermove="handlePointerMove"
      @pointerup="adjustPosition"
      @pointercancel="adjustPosition"
    >
      <img :src="logoUrl" class="w-6 h-6" />
      <span class="mx-2 text-xl font-bold">{{ t("chatDocsAddon") }}</span>
      <button
        aria-label="close"
        class="ml-auto p-1 top-0 right-0 rounded-full hover:bg-rose-400/10"
        @click="chatDocsPanel.visible = false"
      >
        <IconClose class="w-5 h-5" />
      </button>
    </div>
    <ChatDocsPanel
      @close="chatDocsPanel.visible = false"
      :siteConfig="siteConfig"
    />
  </div>
</template>

<style scoped></style>