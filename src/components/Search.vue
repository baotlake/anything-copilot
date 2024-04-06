<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue"
import { throttle } from "lodash-es"
import IconSearch from "@/components/icons/IconSearch.vue"
import IconGlobe from "@/components/icons/IconGlobe.vue"
import { getLocal } from "@/utils/ext"
import { useI18n } from "@/utils/i18n"
import config from "@/assets/config.json"

const bingImg = chrome.runtime.getURL("img/bing.svg")
const googleImg = chrome.runtime.getURL("img/google.svg")
const { t } = useI18n()

enum Engine {
  google = "google",
  bing = "bing",
}

const emit = defineEmits({
  go: (url: string) => true,
})

const focus = ref(false)
const collapsed = ref(true)
const input = ref<HTMLInputElement>()
const value = ref("")
const autocomplete = reactive({
  suggestions: [] as string[],
  selected: -1,
})
const engine = ref(Engine.google)
const engineListVisible = ref(false)

let timerId = -1
let timerId2 = -1

watch(focus, (value) => {
  if (value) {
    collapsed.value = !value
    clearTimeout(timerId)
  } else {
    timerId = window.setTimeout(() => {
      collapsed.value = !value
    }, 300)
  }
})

onMounted(() => {
  getLocal({
    searchEngine: config.data.search.defaultEngine as Engine.google,
  }).then(({ searchEngine }) => {
    engine.value = searchEngine
  })
})

const handleInput = throttle(async (e: Event) => {
  const value = input.value?.value || ""
  if (!value || value.length < 2) {
    autocomplete.suggestions = []
    return
  }

  if (engine.value === Engine.google) {
    const res = await fetch(
      `https://www.google.com/complete/search?q=${value}&client=chrome`
    )
    const data = await res.json()
    autocomplete.suggestions = data[1]
  } else if (engine.value === Engine.bing) {
    const res = await fetch(`https://api.bing.com/osjson.aspx?query=${value}`)
    const data = await res.json()
    autocomplete.suggestions = data[1]
  }
}, 600)

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && value.value) {
    go(value.value)
  }
}

function isLink(value: string) {
  return /^https?:\/\/|(\w+\.)+\w{2,5}/.test(value.trim())
}

function go(value: string) {
  const v = value.trim()
  if (isLink(value)) {
    const url = v.startsWith("http") ? v : `http://${v}`
    emit("go", url)
    return
  }

  const url =
    engine.value === Engine.google
      ? `https://www.google.com/search?q=${v}`
      : `https://www.bing.com/search?q=${v}`

  emit("go", url)
}

function switchEngine(value: Engine) {
  engineListVisible.value = false
  engine.value = value
  chrome.storage.local.set({ searchEngine: value })
}

function handlePointerLeave() {
  timerId2 = window.setTimeout(() => {
    engineListVisible.value = false
  }, 800)
}

function handlePointerEnter() {
  clearTimeout(timerId2)
}
</script>

<template>
  <div class="relative h-10 w-full">
    <div
      :class="[
        'absolute border border-foreground/20 rounded-[20px] w-full shadow bg-background z-10 overflow-hidden',
        'focus-within:shadow-md',
      ]"
      @pointerleave="handlePointerLeave"
      @pointerenter="handlePointerEnter"
    >
      <div aria-label="search box" class="flex px-2 items-center">
        <button
          :class="[
            'group size-8 flex items-center justify-center shrink-0 rounded-full hover:bg-background-soft cursor-pointer',
          ]"
          @click="engineListVisible = !engineListVisible"
        >
          <img
            class="size-5 group-active:scale-90 transition-transform"
            :src="engine == Engine.bing ? bingImg : googleImg"
          />
        </button>
        <div class="px-1 py-2 w-full" @click="input?.focus()">
          <input
            ref="input"
            type="text"
            autocomplete="search"
            class="border-none outline-none bg-transparent text-base w-full"
            :placeholder="t('searchPlaceholder')"
            v-model="value"
            @focus="engineListVisible = !(focus = true)"
            @blur="focus = false"
            @input="handleInput"
            @keydown="handleKeyDown"
          />
        </div>
      </div>

      <div v-if="engineListVisible" class="border-t border-foreground/20">
        <div
          class="flex items-center px-2 py-1 cursor-pointer hover:bg-background-soft"
          @click="switchEngine(Engine.google)"
        >
          <div class="size-8 flex items-center justify-center">
            <img class="size-5" :src="googleImg" />
          </div>
          <span class="px-1">Google</span>
        </div>
        <div
          class="flex items-center px-2 py-1 cursor-pointer hover:bg-background-soft"
          @click="switchEngine(Engine.bing)"
        >
          <div class="size-8 flex items-center justify-center">
            <img class="size-5" :src="bingImg" />
          </div>
          <span class="px-1">Bing</span>
        </div>
      </div>

      <div
        v-if="!collapsed && value"
        :class="[
          'scrollbar overflow-auto border-t border-foreground/20 transition-all duration-300 ease-in-out',
          !collapsed ? 'max-h-52' : 'max-h-0',
        ]"
      >
        <div
          class="px-2 py-1 flex items-center cursor-pointer hover:bg-background-soft"
          @click="go(value)"
        >
          <div class="size-8 flex items-center justify-center">
            <IconGlobe v-if="isLink(value)" class="size-5" />
            <IconSearch v-else class="size-5" />
          </div>
          <span class="px-1">
            {{ value }}
          </span>
        </div>
        <div v-if="autocomplete.suggestions.length">
          <div
            v-for="suggestion in autocomplete.suggestions"
            :key="suggestion"
            class="px-2 py-1 flex items-center cursor-pointer hover:bg-background-soft"
            @click="go(suggestion)"
          >
            <div class="size-8 flex items-center justify-center">
              <IconGlobe v-if="isLink(suggestion)" class="size-5" />
              <IconSearch v-else class="size-5" />
            </div>
            <span class="px-1">
              {{ suggestion }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
