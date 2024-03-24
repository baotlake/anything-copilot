<script setup lang="ts">
import Multitasking from "@/components/Multitasking.vue"
import PipSplash from "@/components/PipSplash.vue"
import { pipLoading } from "@/store/content"
import LoadingBar from "@/components/LoadingBar.vue"
import ChatDocsAddon from "@/components/chatdocs/ChatDocsAddon.vue"
</script>

<template>
  <Multitasking />

  <div
    v-if="pipLoading.splashScreen && pipLoading.isLoading"
    class="fixed top-0 left-0 w-full h-full"
  >
    <PipSplash />
  </div>

  <div
    v-if="!pipLoading.splashScreen && pipLoading.isLoading"
    class="fixed w-full top-0 left-0 z-[9999]"
  >
    <LoadingBar />
  </div>

  <ChatDocsAddon />
</template>

<style scoped></style>