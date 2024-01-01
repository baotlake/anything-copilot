<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from "vue"
import IconNoteStackAdd from "@/components/icons/IconNoteStackAdd.vue"
import { chatDocsPanel, docsAddon } from "@/store"
import ChatDocsPanel from "@/components/chatdocs/ChatDocsPanel.vue"

const logoUrl = chrome.runtime.getURL("/logo.svg")
const div = ref<HTMLDivElement>()

let timer = 0

function onDragOver(e: DragEvent) {
  docsAddon.visible = true
  clearTimeout(timer)
  timer = window.setTimeout(() => {
    docsAddon.visible = false
  }, 180)

  console.log(e.dataTransfer?.items.length, e.dataTransfer?.items[0]?.type)
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  docsAddon.active = false
  docsAddon.visible = false

  if (e.dataTransfer) {
    const items: typeof chatDocsPanel.inputs = []

    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      const item = e.dataTransfer.items[i]

      if (item.kind == "file") {
        const file = item.getAsFile()
        if (file) {
          items.push({
            key: crypto.randomUUID(),
            kind: item.kind,
            type: item.type,
            data: file,
          })
        }
      }

      if (item.kind == "string") {
        const { kind, type } = item
        const data = await new Promise<string>((r) => item.getAsString(r))
        items.push({
          key: crypto.randomUUID(),
          kind,
          type,
          data,
        })
      }
    }

    // dropZone.items = items

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

onMounted(() => {
  const doc = div.value?.ownerDocument || document
  doc.addEventListener("dragover", onDragOver, true)
})

onUnmounted(() => {
  const doc = div.value?.ownerDocument || document
  doc.removeEventListener("dragover", onDragOver, true)
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
      <p class="text-center text-sm mt-2">支持PDF、DOCX</p>
      <div :class="['absolute text-xs flex items-center bottom-2 right-2']">
        <img :src="logoUrl" class="w-3 h-3" />
      </div>
    </div>
  </div>

  <div
    v-if="chatDocsPanel.visible"
    :class="[
      'fixed bottom-10 left-1/2 top-1/2 p-3 w-80 border rounded-lg z-[9999]',
      'border-foreground/10 bg-background -translate-x-1/2 -translate-y-1/2',
      'h-fit shadow-lg dark:border-2',
    ]"
  >
    <ChatDocsPanel @close="chatDocsPanel.visible = false" />
  </div>
</template>

<style scoped></style>
