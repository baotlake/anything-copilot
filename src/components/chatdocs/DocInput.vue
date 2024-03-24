<script setup lang="ts">
import IconNoteStackAdd from "@/components/icons/IconNoteStackAdd.vue"
import type { chatDocsPanel } from "@/store/content"
import { ref } from "vue"
import { useI18n } from "@/utils/i18n"
import { getDocItem } from "./helper"

const { t } = useI18n()
const dragEnter = ref(false)

const emit = defineEmits({
  input: (inputs: typeof chatDocsPanel.inputs) => {},
})

const handleFileInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) {
    const inputs = Array.from(input.files).map((file) => ({
      key: crypto.randomUUID(),
      kind: "file" as const,
      type: file.type,
      data: file,
    }))

    emit("input", inputs)
  }
}

const onDrop = async (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer) {
    console.log("item: ", Array.from(e.dataTransfer.items))
    const items = await getDocItem(e.dataTransfer.items)
    emit("input", items)
  }
}

const onClick = async () => {
  const fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.multiple = true

  const itmes = await new Promise<typeof chatDocsPanel.inputs>((resolve) => {
    fileInput.oninput = async (e) => {
      if (fileInput.files) {
        const items = await getDocItem(fileInput.files)
        resolve(items)
      }
      resolve([])
    }
    fileInput.click()
  })

  emit("input", itmes)
}
</script>

<template>
  <label
    for="anything-copilot-doc-input"
    :class="[
      'relative flex items-center justify-center gap-2 w-full h-14 ',
      'px-4 rounded-lg border-2 bg-background-soft transition-all *:pointer-events-none',
      {
        'border-primary scale-105': dragEnter,
        'border-background-soft': !dragEnter,
      },
    ]"
    @dragenter="dragEnter = true"
    @dragleave="dragEnter = false"
    @click="onClick"
    @dragover="(e) => e.preventDefault()"
    @drop="onDrop"
  >
    <IconNoteStackAdd class="shrink-0" />
    <span>{{ t("chatDocs.selectFile") }}</span>
  </label>
</template>

<style scoped></style>