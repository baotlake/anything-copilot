<script setup lang="ts">
import { pipLauncher } from "@/store"
import PipLauncher from "@/components/PipLauncher.vue"
import { MessageType } from "@/types"

import { useI18n } from "vue-i18n"
import ChatDocsAddon from "@/components/chatdocs/ChatDocsAddon.vue"
import ContentSidebarAddon from "@/components/sidebar/ContentSidebarAddon.vue"
import { onMounted } from "vue"
const { t } = useI18n()

const topFrame = window.parent == window

onMounted(() => {
  chrome.runtime?.sendMessage({ type: MessageType.contentMounted })
})
</script>

<template>
  <PipLauncher
    v-if="pipLauncher.visible"
    @close="pipLauncher.visible = false"
  />

  <ChatDocsAddon />
  <ContentSidebarAddon v-if="topFrame" />
</template>
