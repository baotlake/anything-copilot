<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { emptyTab, checkContent } from "@/utils/ext";
import { items } from "@/content/store";

const activeTab = ref<chrome.tabs.Tab>(emptyTab);
const manifest = reactive(chrome.runtime.getManifest());
const avaiable = ref(false);

onMounted(() => {
  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    console.log(tabs);
    if (tabs[0]) activeTab.value = tabs[0];

    checkContent(tabs[0].id!).then((value) => {
      avaiable.value = value;
    });
  });
});

const host = computed({
  get: () => {
    if (!activeTab.value.url) return "";
    const u = new URL(activeTab.value.url);
    return u.host;
  },
  set: () => {},
});

async function handleWriteHtml() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (tab) {
    chrome.tabs.sendMessage(tab.id!, {
      type: "pip",
      options: {
        url: tab.url,
        mode: "write-html",
      },
    });
  }
}

async function handleClickLaunch(url: string) {
  console.log(activeTab.value);
  chrome.runtime.sendMessage({
    type: "bg-pip-launch",
    url,
  });
}
</script>

<template>
  <main class="w-[300px] p-4 mx-auto">
    <div>
      <span class="font-bold opacity-50">Anything Copilot</span>
      <span class="mx-2 text-sm opacity-50">{{ manifest.version }}</span>
    </div>

    <div class="text-sm truncate mt-6">
      {{ host }}
      <span class="text-rose-800" v-if="!avaiable">{{
        "is protected by browser"
      }}</span>
    </div>
    <button
      :class="[
        'primary-btn w-full flex items-center mt-2 rounded-lg p-2 px-3',
        {
          'cursor-not-allowed': !avaiable,
        },
      ]"
      @click="handleWriteHtml"
    >
      <span
        class="w-5 h-5 inline-block mr-3 rounded"
        :style="{
          background: 'center / contain url(' + activeTab.favIconUrl + ')',
        }"
      >
      </span>
      <span class="text-base">Open in Copilot window</span>
    </button>

    <div class="text-sm mt-6">other</div>
    <button
      v-for="item of items"
      class="primary-btn w-full flex items-center mt-3 rounded-lg p-2 px-3"
      @click="handleClickLaunch(item.url)"
    >
      <span
        class="w-5 h-5 inline-block mr-3 rounded"
        :style="{
          background: 'center / contain url(' + item.img + ')',
        }"
      >
      </span>
      <span class="text-base">{{ item.title }}</span>
    </button>

    <div class="mt-6"></div>
  </main>
</template>

<style scoped>
.primary-btn {
  background: var(--color-background-soft);
}
.primary-btn:hover {
  background: var(--color-background-mute);
}
</style>
