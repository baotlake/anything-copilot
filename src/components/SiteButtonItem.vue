<script setup lang="ts">
defineProps<{
  image?: string;
  title: string;
}>();
</script>

<template>
  <button class="primary-btn w-full flex items-center mt-2 rounded-lg p-2">
    <span
      class="w-6 h-6 inline-block mr-2 rounded"
      :style="{
        background: 'center / contain url(' + image + ')',
      }"
    >
    </span>
    <span class="text-base font-bold">{{ title }}</span>
  </button>
</template>

<style scoped></style>
