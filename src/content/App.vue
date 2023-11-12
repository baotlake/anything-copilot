<script setup lang="ts">
import { contentCss, pipLauncher } from "./store";
import PipLauncher from "@/components/PipLauncher.vue";
</script>

<template>
  <PipLauncher
    v-if="pipLauncher.visible"
    @close="pipLauncher.visible = false"
  />
</template>

<style scoped></style>
