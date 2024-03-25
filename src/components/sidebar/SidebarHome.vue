<script setup lang="ts">
import {} from "vue"
import { useI18n } from "@/utils/i18n"
import Search from "@/components/Search.vue"
import SiteButton from "@/components/SiteButton.vue"
import type config from "@/assets/config.json"

const logoUrl = chrome.runtime.getURL("/logo.svg")
const { t } = useI18n()

defineProps<{
  recentItems: typeof config.data.popularSites
  popularItems: typeof config.data.popularSites
}>()
const emit = defineEmits({
  go: (url: string) => true,
  removeRecentItem: (url: string) => true,
})
</script>

<template>
  <div class="flex flex-col p-6 w-full max-w-md mx-auto">
    <div class="flex flex-col items-center gap-2 mx-auto mt-16">
      <img :src="logoUrl" class="size-16" />
      <span class="text-2xl font-bold my-2">{{ t("sidebar") }}</span>
    </div>

    <div class="my-12">
      <Search @go="(url) => emit('go', url)" />
    </div>

    <div class="flex flex-wrap gap-x-4 gap-y-4 justify-center">
      <SiteButton
        v-for="item of recentItems"
        :icon="item.icon"
        :title="item.title"
        badge="remove"
        @click="emit('go', item.url)"
        @remove="emit('removeRecentItem', item.url)"
      />
    </div>

    <!-- <div class="text-center my-3">Popular</div> -->
    <div class="w-full my-6 border-b border-background-soft h-0"></div>
    <div class="flex flex-wrap gap-x-4 gap-y-4 justify-center">
      <SiteButton
        v-for="item of popularItems"
        :icon="item.icon"
        :title="item.title"
        @click="emit('go', item.url)"
      />
    </div>
  </div>
</template>

<style scoped></style>
