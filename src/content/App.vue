<script setup lang="ts">
import { pipLauncher } from "@/store"
import PipLauncher from "@/components/PipLauncher.vue"

import { useI18n } from "vue-i18n"
import ChatDocsAddon from "@/components/chatdocs/ChatDocsAddon.vue"

const { t } = useI18n()
</script>

<template>
  <PipLauncher
    v-if="pipLauncher.visible"
    @close="pipLauncher.visible = false"
  />

  <ChatDocsAddon />
</template>

<style scoped></style>
