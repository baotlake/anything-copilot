<script setup lang="ts">
import { pipLauncher } from "@/store";
import PipLauncher from "@/components/PipLauncher.vue";

import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <PipLauncher
    v-if="pipLauncher.visible"
    @close="pipLauncher.visible = false"
  />
</template>

<style scoped></style>
