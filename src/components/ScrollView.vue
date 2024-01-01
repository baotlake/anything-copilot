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
      class="fade sticky top-0 left-0 w-full h-4 z-50"
    ></div>
    <slot></slot>
    <div
      v-if="fade == true"
      class="fade sticky bottom-0 left-0 w-full h-4 z-50"
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
  background: rgba(var(--fg-rgb), 0.1);
  background-clip: content-box;
}

.fade {
  --fade-bg-color: var(--color-background);
}
.fade.top-0 {
  background: linear-gradient(to bottom, var(--fade-bg-color), transparent);
}
.fade.bottom-0 {
  background: linear-gradient(to bottom, transparent, var(--fade-bg-color));
}
</style>
