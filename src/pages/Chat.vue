<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import Webview from "@/components/Webview.vue"
import { autoPointerCapture } from "@/utils/dom"
import IconMenu from "@/components/icons/IconMenu.vue"
import { useI18n } from "@/utils/i18n"

const logoUrl = chrome.runtime.getURL("/logo.svg")
const globeImg = chrome.runtime.getURL("img/globe.svg")

const { t } = useI18n()

const collpase = ref(false)
const editorHeight = ref(144)
const innerWidth = ref(window.innerWidth)

onMounted(() => {
  window.addEventListener("resize", handleResize)
})

onUnmounted(() => {
  window.removeEventListener("resize", handleResize)
})

const handlePointerMove = (e: PointerEvent) => {
  if (e.buttons) {
    editorHeight.value -= e.movementY
  }
}

const handleResize = () => {
  innerWidth.value = window.innerWidth
}
</script>

<template>
  <div class="flex w-screen h-screen">
    <div
      :class="[
        'flex flex-col h-full w-64 transition-all border-r border-foreground/15',
        {
          'relative ': innerWidth > 1280,
          'absolute bg-background shadow-md z-20': innerWidth <= 1280,
          '-ml-64': collpase,
          '-ml-0': !collpase,
        },
      ]"
    >
      <div class="flex p-3 gap-3">
        <img :src="logoUrl" class="size-10" />
        <div class="text-4xl font-bold">Chat</div>
      </div>
      <div class="p-3 text-lg">Group</div>
      <div class="flex flex-col gap-1 px-3">
        <div
          v-for="i in 3"
          :key="i"
          class="flex px-3 py-2 rounded-md cursor-pointer hover:bg-background-mute"
        >
          <div class="flex *:bg-background *:rounded-full *:-ml-2 mx-2">
            <img class="" :src="globeImg" />
            <img class="" :src="globeImg" />
            <img class="" :src="globeImg" />
          </div>
          <div class="text-base">Chat GPT</div>
        </div>
      </div>
      <div class="p-3 text-lg">AI Sites</div>
      <div class="flex flex-col gap-1 px-3">
        <div
          v-for="i in 6"
          :key="i"
          class="flex px-3 py-2 gap-2 rounded-md cursor-pointer hover:bg-background-mute"
        >
          <img class="size-6 bg-background rounded-full" :src="globeImg" />
          <div class="text-base">ChatGPT</div>
        </div>
      </div>
    </div>
    <div
      v-if="innerWidth <= 1280 && !collpase"
      class="fixed w-full h-full bg-black/30 top-0 left-0 z-10"
      @click="collpase = !collpase"
    ></div>

    <div class="flex flex-col w-full">
      <div class="flex flex-1 p-6 w-full h-full gap-6">
        <div
          v-for="url in [
            'https://chat.openai.com',
            'https://gemini.google.com/',
            'https://copilot.microsoft.com/',
          ]"
          class="w-1/3 h-full rounded-xl border border-foreground/15 overflow-hidden"
        >
          <Webview ref="webviews" :key="url" :url="url" />
        </div>
      </div>
      <div
        class="relative min-h-16 max-h-[30%] h-36 w-full"
        :style="{ height: editorHeight + 'px' }"
      >
        <div
          :class="[
            'w-full h-1 -top-0.5 left-0 cursor-ns-resize border-t border-foreground/15',
            'hover:border-transparent hover:bg-primary/50',
          ]"
          @pointerdown="autoPointerCapture"
          @pointermove="handlePointerMove"
        ></div>

        <button class="absolute p-2" @click="collpase = !collpase">
          <IconMenu />
        </button>

        <div class="py-3 px-12">
          <textarea
            class="resize-none w-full h-full border outline-none p-3 rounded-xl"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
