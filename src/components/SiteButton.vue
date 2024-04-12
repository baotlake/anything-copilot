<script setup lang="ts">
import IconSplitscreenRight from "@/components/icons/IconSplitscreenRight.vue"
import IconAmpStories from "@/components/icons/IconAmpStories.vue"
import IconClose from "./icons/IconClose.vue"
import { handleImgError } from "@/utils/dom"

const globeImg = chrome.runtime.getURL("img/globe.svg")

defineProps<{
  icon: string
  title: string
  badge?: "popup" | "sidebar" | "remove"
  small?: boolean
  url?: string
}>()

defineEmits(["click", "remove"])
</script>

<template>
  <a
    :class="[
      'group shrink-0 relative flex flex-col items-center justify-self-center rounded-lg ',
      'py-1 px-0.5 hover:bg-background-soft text-inherit cursor-pointer',
      small ? 'w-[58px]' : 'w-16',
    ]"
    @click="(e) => (e.preventDefault(), $emit('click'))"
    :href="url"
    draggable="true"
  >
    <div class="p-2.5 rounded-full bg-background-soft">
      <img
        class="size-6 rounded pointer-events-none"
        :src="icon"
        :data-fallback="globeImg"
        loading="lazy"
        @error="handleImgError"
      />
    </div>
    <div class="flex flex-col justify-center h-8 w-full text-center">
      <div class="text-xs max-w-full break-words leading-tight line-clamp-2">
        {{ title }}
      </div>
    </div>

    <IconSplitscreenRight
      v-if="badge === 'sidebar'"
      class="size-3 absolute top-1 right-1 opacity-0 group-hover:opacity-65"
    />
    <IconAmpStories
      v-if="badge === 'popup'"
      class="size-3 absolute top-1 right-1 opacity-0 group-hover:opacity-65"
    />

    <div
      v-if="badge === 'remove'"
      :class="[
        'size-4 absolute top-[-4px] right-[-4px] opacity-0 group-hover:opacity-65 rounded-full',
        'bg-background-soft hover:bg-red-100 hover:text-red-600 hover:scale-105 flex items-center justify-center',
      ]"
      @click="(e) => (e.stopPropagation(), $emit('remove'))"
    >
      <IconClose class="size-3" />
    </div>
  </a>
</template>

<style scoped></style>
