<script setup lang="ts">
import { dispatchContentEvent } from "@/content/event"
import { reactive, ref } from "vue"
import IconClose from "./icons/IconClose.vue"
import { useI18n } from "@/utils/i18n"
import { ContentEventType } from "@/types"

const { t } = useI18n()

const emit = defineEmits(["close"])

const host = ref(location.host)

function handleClick() {
  dispatchContentEvent({
    type: ContentEventType.pip,
    detail: {
      url: location.href,
      mode: "write-html",
    },
  })
  emit("close")
}

function handleClose(e: MouseEvent) {
  e.stopPropagation()
  emit("close")
}
</script>

<template>
  <div
    class="pip-launcher rounded-lg overflow-hidden shadow-2xl cursor-pointer"
    @click="handleClick"
  >
    <div
      :class="[
        'h-8 w-full text-sm px-3 flex items-center',
        'bg-[var(--color-background-mute)]',
      ]"
    >
      <div class="truncate opacity-40 select-none">
        {{ host }}
      </div>
      <div
        :class="[
          'ml-auto w-6 h-6 rounded-full flex items-center justify-center text-lg leading-6',
          'hover:bg-[var(--color-background-soft)]',
        ]"
        @click="handleClose"
      >
        <IconClose class="w-4 h-4" />
      </div>
    </div>
    <div class="text-2xl font-bold text-center mt-24 opacity-60">
      Anything Copilot
    </div>
    <div class="mt-28">
      <div class="flex flex-col items-center">
        <div
          class="w-36 h-36 rounded-full animate-ping bg-[var(--color-background-soft)]"
        ></div>

        <div class="font-bold text-base">{{ t("clickHere") }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pip-launcher {
  position: fixed;
  height: 80%;
  max-height: 1200px;
  top: 10%;
  z-index: 9999;
  background: var(--color-background);
  border: 1.5px solid var(--color-background-mute);
  width: 350px;
  max-width: 90vw;
  right: 10vw;
}
</style>
