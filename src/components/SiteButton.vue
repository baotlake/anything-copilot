<script setup lang="ts">
import IconSplitscreenRight from "@/components/icons/IconSplitscreenRight.vue"
import IconAmpStories from "@/components/icons/IconAmpStories.vue"
import IconClose from "./icons/IconClose.vue"

defineProps<{
  icon: string
  title: string
  badge?: "popup" | "sidebar" | "remove"
  small?: boolean
}>()

defineEmits(["click", "remove"])
</script>

<template>
  <button
    :class="[
      'group shrink-0 relative flex flex-col items-center justify-self-center rounded-lg p-1 bg-background-soft hover:bg-background-mute',
      small ? 'w-[58px]' : 'w-16',
    ]"
    @click="$emit('click')"
  >
    <!-- <span
      class="size-6 rounded mt-2 mb-1"
      :style="{
        background: 'center / contain url(' + icon + ')',
      }"
    >
    </span> -->
    <img
      class="size-6 rounded mt-2 mb-1"
      :src="icon"
      loading="lazy"
      @error="(e) => (e.target as HTMLImageElement).src = ''"
    />
    <div class="flex flex-col justify-center h-6 my-1 w-full">
      <div class="text-xs max-w-full break-words leading-3 line-clamp-2">
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
        'bg-background-soft hover:text-red-500 flex items-center justify-center',
      ]"
      @click="
        (e) => {
          e.stopPropagation()
          e.preventDefault()
          $emit('remove')
        }
      "
    >
      <IconClose class="size-3" />
    </div>
  </button>
</template>

<style scoped></style>
