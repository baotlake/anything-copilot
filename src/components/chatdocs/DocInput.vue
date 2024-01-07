<script setup lang="ts">
import IconNoteStackAdd from "@/components/icons/IconNoteStackAdd.vue"
import type { chatDocsPanel } from "@/store"
import { ref } from "vue"
import { useI18n } from "@/utils/i18n"

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
</script>

<template>
  <label
    for="anything-copilot-doc-input"
    :class="[
      'relative flex items-center justify-center gap-2 w-full h-14 ',
      'px-4 rounded-lg border-2 bg-background-soft transition-all',
      {
        'border-primary scale-105': dragEnter,
        'border-background-soft': !dragEnter,
      },
    ]"
  >
    <IconNoteStackAdd class="shrink-0" />
    <span>{{ t("chatDocs.selectFile") }}</span>
    <input
      multiple
      type="file"
      id="anything-copilot-doc-input"
      class="opacity-0 w-full h-full absolute top-0 left-0 cursor-pointer"
      @input="handleFileInput"
      @dragenter="dragEnter = true"
      @dragleave="dragEnter = false"
      @dragover="(e) => e.preventDefault()"
    />
  </label>
</template>

<style scoped></style>
