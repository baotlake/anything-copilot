<script setup lang="ts">
import IconClose from "@/components/icons/IconClose.vue"
import IconProgressActivity from "@/components/icons/IconProgressActivity.vue"
import IconNoteStack from "@/components/icons/IconNoteStack.vue"
import type { chatDocsPanel } from "@/store/content"
import { useI18n } from "@/utils/i18n"

defineProps<{
  item: (typeof chatDocsPanel.docMap)[0]
}>()

defineEmits(["remove", "pick"])

const { t } = useI18n()
</script>

<template>
  <div
    v-if="!item.removed"
    class="relative p-1 w-full flex gap-2 items-center rounded bg-background-soft"
  >
    <div
      class="px-1 w-12 h-12 flex flex-col items-center justify-center shrink-0"
    >
      <IconProgressActivity v-if="item?.loading" class="w-8 h-8 animate-spin" />
      <IconNoteStack v-else class="w-8 h-8" />
    </div>
    <div class="w-full min-w-0 cursor-pointer" @click="$emit('pick')">
      <div class="flex items-center mb-1">
        <div class="mr-auto text-base truncate">
          {{ item.name }}
        </div>
        <button
          class="p-1 ml-1.5 rounded-full opacity-70 hover:opacity-100 hover:bg-rose-400/10"
          aria-label="remove file"
          @click="$emit('remove')"
        >
          <IconClose class="w-3.5 h-3.5" />
        </button>
      </div>
      <div class="text-sm text-primary">
        <span
          >{{ t("selected") }}:
          {{ item.contents.filter((v) => v.selected).length }}/{{
            item.contents.length
          }}
          {{ t("page") }}</span
        >
      </div>
    </div>
  </div>
</template>

<style scoped></style>