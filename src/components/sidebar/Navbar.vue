<script setup lang="ts">
import { ref } from "vue"
import { homeUrl } from "@/utils/const"
import { useI18n } from "@/utils/i18n"
import { handleImgError } from "@/utils/dom"
import { type PageInfo } from "../Webview.vue"

import IconClose from "@/components/icons/IconClose.vue"
import IconRefresh from "@/components/icons/IconRefresh.vue"
import IconPhone from "@/components/icons/IconPhone.vue"
import IconHide from "@/components/icons/IconHide.vue"
import IconNavigateBefore from "@/components/icons/IconNavigateBefore.vue"
import IconNavigateNext from "@/components/icons/IconNavigateNext.vue"
import IconAdd from "@/components/icons/IconAdd.vue"

defineProps<{
  active: number
  pages: { url: string }[]
  pagesInfo: (PageInfo | null)[]
  isMobileUA: boolean
  isPointerIn: boolean
  closeWebview?: (index: number) => void
  reload?: () => void
  toggleMobileUA: () => void
  collapseSidebar?: () => void
  closeSidebar?: () => void
  goBack?: () => void
  goForward?: () => void
}>()

const emit = defineEmits<{
  switch: [number]
  drop: [string]
}>()

const { t } = useI18n()
const logoUrl = chrome.runtime.getURL("/logo.svg")
const globeImg = chrome.runtime.getURL("img/globe.svg")
let count = 0

const dragActive = ref(false)

const handleDragEnter = (e: DragEvent) => {
  count++
  if (e.dataTransfer?.types.includes("text/uri-list")) {
    e.preventDefault()
    dragActive.value = true
  }
}

const handleDragLeave = (e: DragEvent) => {
  count--
  if (count <= 0) {
    dragActive.value = false
  }

  console.log("count: ", count)
}

const handleDragOver = (e: DragEvent) => {
  if (e.dataTransfer?.types.includes("text/uri-list")) {
    e.preventDefault()
  }
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  dragActive.value = false

  if (!e.dataTransfer) {
    return
  }

  const url = e.dataTransfer.getData("text/uri-list")
  console.log("url: ", url)
  emit("drop", url)
}
</script>

<template>
  <div
    :class="[
      'flex gap-1 items-center justify-between h-9 px-1 z-10 shadow-sm',
      '*:size-7 *:flex *:items-center *:justify-center ',
    ]"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <a
      draggable="true"
      @click="(e) => (e.preventDefault(), $emit('switch', -1))"
      :href="homeUrl"
      title="Anything Copilot"
      :class="[
        'group rounded-full relative box-border border',
        active === -1
          ? 'bg-primary/10 border-primary-500'
          : 'border-transparent hover:bg-background-mute bg-background-soft',
      ]"
    >
      <img
        :class="[
          'size-4 group-hover:opacity-85 transition-all pointer-events-none',
          false ? 'opacity-85' : 'opacity-50',
        ]"
        :src="logoUrl"
      />
      <!-- <IconHome class="size-5 group-active:scale-90 transition-transform" /> -->
    </a>

    <a
      v-for="(page, i) of pages"
      draggable="true"
      @click="(e) => (e.preventDefault(), $emit('switch', i))"
      :href="pagesInfo[i]?.url"
      :title="pagesInfo[i]?.title"
      :class="[
        'group rounded-full relative box-border border',
        active === i
          ? 'bg-primary/10 border-primary-500'
          : 'border-transparent hover:bg-background-mute bg-background-soft',
      ]"
    >
      <img
        class="size-4 pointer-events-none"
        loading="lazy"
        :src="pagesInfo[i]?.icon || globeImg"
        :data-fallback="globeImg"
        @error="handleImgError"
      />
      <span
        v-if="active === i && closeWebview"
        class="absolute hidden group-hover:block rounded-full bg-primary-500 text-white -top-0.5 -right-0.5 transition-all p-0.5"
        @click="
          (e) => (e.preventDefault(), e.stopPropagation(), closeWebview?.(i))
        "
      >
        <IconClose class="size-2" />
      </span>
    </a>
    <a
      v-if="dragActive"
      class="rounded-full box-border border border-primary-500 bg-primary/10 text-primary"
    >
      <IconAdd class="size-5 group-active:scale-90 transition-transform" />
    </a>

    <span class="mx-auto"></span>
    <button
      v-if="goBack"
      @click="goBack()"
      class="group hover:bg-background-soft rounded-full"
    >
      <IconNavigateBefore
        class="size-5 scale-125 group-active:-translate-x-1 transition-transform"
      />
    </button>
    <button
      v-if="goForward"
      @click="goForward()"
      class="group hover:bg-background-soft rounded-full"
    >
      <IconNavigateNext
        class="size-5 scale-125 group-active:translate-x-1 transition-transform"
      />
    </button>
    <button
      v-if="reload"
      @click="reload()"
      :title="t('refresh')"
      class="group hover:bg-background-soft rounded-full"
    >
      <IconRefresh
        class="size-5 group-active:rotate-180 transition-transform"
      />
    </button>
    <button
      v-if="toggleMobileUA"
      @click="toggleMobileUA"
      :title="t('mobileView')"
      :class="[
        'group hover:bg-background-soft rounded-full transition ease-in-out delay-200',
        { 'bg-background-soft text-primary-500 ': isMobileUA },
        isPointerIn ? '' : ' opacity-75',
      ]"
    >
      <IconPhone class="size-4 group-active:scale-90 transition-transform" />
    </button>
    <button
      v-if="collapseSidebar"
      @click="collapseSidebar()"
      :title="t('minimize')"
      class="group hover:bg-background-soft rounded-full"
    >
      <IconHide
        class="size-5 scale-95 group-active:scale-90 transition-transform"
      />
    </button>
    <button
      v-if="closeSidebar"
      @click="closeSidebar()"
      :title="t('close')"
      class="group hover:bg-background-soft rounded-full"
    >
      <IconClose class="size-5 group-active:scale-90 transition-transform" />
    </button>
  </div>
</template>

<style scoped></style>
