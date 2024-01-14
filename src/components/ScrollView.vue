<script setup lang="ts">
const props = defineProps<{
  class?: string
  fade?: boolean
}>()
</script>

<template>
  <div :class="['scrollbar relative overflow-auto', props.class]">
    <div
      v-if="fade == true"
      class="sticky top-0 left-0 w-full h-4 z-10 bg-gradient-to-b from-background to-transparent"
    ></div>
    <slot></slot>
    <div
      v-if="fade == true"
      class="sticky bottom-0 left-0 w-full h-4 z-10 bg-gradient-to-t from-background to-transparent"
    ></div>
  </div>
</template>

<style scoped>
.scrollbar::-webkit-scrollbar {
  background: transparent;
  width: 12px;
}
.scrollbar::-webkit-scrollbar-thumb {
  background: transparent;
  transition: all 0.3s;
}
.scrollbar:hover::-webkit-scrollbar-thumb {
  border: 4px solid transparent;
  background-clip: content-box;
  @apply bg-foreground/10;
}
</style>
