<script setup lang="ts">
import { ref, onMounted, reactive, computed } from "vue"
import { getLocal, updateFrameNetRules } from "@/utils/ext"
import config from "@/assets/config.json"
import LoadingBar from "@/components/LoadingBar.vue"
import Webview from "@/components/Webview.vue"
import { useI18n } from "@/utils/i18n"

const logoUrl = chrome.runtime.getURL("/logo.svg")

const { t } = useI18n()

const url = ref("")
const popularItems = reactive(config.data.popularSites)
const recentItems = reactive<{ url: string; title: string; icon: string }[]>([])

const protectedUrl = computed(() => {
  if (!url.value) {
    return true
  }

  const u = new URL(url.value)
  if (!["http:", "https:"].includes(u.protocol)) {
    return true
  }

  return false
})

onMounted(() => {
  const q = new URLSearchParams(location.search)
  const initUrl = q.get("url") || ""
  url.value = initUrl

  getLocal({
    popularSites: config.data.popularSites,
    sidebarRecentItems: [],
  }).then(({ popularSites, sidebarRecentItems }) => {
    if (popularSites) {
      popularItems.splice(0, popularItems.length, ...popularSites)
    }
    if (sidebarRecentItems) {
      recentItems.splice(0, recentItems.length, ...sidebarRecentItems)
    }
  })
})

function go(link: string) {
  url.value = link
}
</script>

<template>
  <div class="w-full h-screen">
    <Webview v-if="!protectedUrl" :url="url" />

    <div v-else class="flex flex-col p-6 max-w-md mx-auto">
      <div class="flex flex-col items-center gap-2 mx-auto mt-16">
        <img :src="logoUrl" class="size-16" />
        <span class="text-2xl font-bold my-2">{{ t("sidebar") }}</span>
      </div>

      <div class="grid grid-cols-4 gap-y-4 justify-between mt-24">
        <button
          v-for="item of recentItems"
          class="group w-16 shrink-0 relative flex flex-col items-center justify-between justify-self-center rounded-lg px-2 py-3 bg-background-soft"
          @click="go(item.url)"
        >
          <div
            class="size-6 rounded"
            :style="{
              background: 'center / contain url(' + item.icon + ')',
            }"
          ></div>
          <div
            class="text-xs max-w-full mt-1 break-words leading-3 line-clamp-2"
          >
            {{ item.title }}
          </div>
        </button>
      </div>

      <!-- <div class="text-center my-3">Popular</div> -->
      <div class="w-full my-6 border-b border-b-slate-400/60 h-0"></div>
      <div class="grid grid-cols-4 gap-y-4 justify-between">
        <button
          v-for="item of popularItems"
          class="group w-16 shrink-0 relative flex flex-col items-center justify-between justify-self-center rounded-lg px-2 py-3 bg-background-soft"
          @click="go(item.url)"
        >
          <div
            class="size-6 rounded"
            :style="{
              background: 'center / contain url(' + item.icon + ')',
            }"
          ></div>
          <div
            class="text-xs max-w-full mt-1 break-words leading-3 line-clamp-2"
          >
            {{ item.title }}
          </div>
        </button>
      </div>
    </div>
  </div>

  <!-- <LoadingBar /> -->
</template>

<style scoped></style>
