<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue"
import IconMinimize from "@/components/icons/IconMinimize.vue"
import IconSplitRight from "@/components/icons/IconSplitscreenRight.vue"
import IconClose from "@/components/icons/IconClose.vue"
import { ContentEventType, MessageType, ServiceFunc } from "@/types"
import { pipWindow } from "@/store/content"
import { throttle } from "lodash-es"
import IconRefresh from "./icons/IconRefresh.vue"
import { dispatchContentEvent } from "@/content/event"
import { useI18n } from "@/utils/i18n"
import IconHide from "./icons/IconHide.vue"
import { pip } from "@/content/pip"
import { getPageIcon } from "@/utils/dom"
import { contentInvoke } from "@/utils/invoke"
import IconKeyboard from "@/components/icons/IconKeyboard.vue"
import IconEdit from "@/components/icons/IconEdit.vue"

const logoUrl = chrome.runtime.getURL("/logo.svg")
const globeImg = chrome.runtime.getURL("img/globe.svg")

const isWindows = navigator.userAgentData?.platform == "Windows"
const modiferKey = isWindows ? "ctrl" : "⌘"
let timer = 0
let sheet: CSSStyleSheet | null = null

const open = ref(false)
const pinOpen = ref(false)
const wrapper = ref<HTMLDivElement>()
const { t } = useI18n()
const rect = ref({
  w: 0,
  h: 0,
  l: 0,
  t: 0,
  r: 0,
  b: 0,
})
const toggleMinimizeCommand = ref()
const normalRect = ref({ w: 420, h: 800, l: 0, t: 0, r: 0, b: 0 })

const isMinimized = computed(() => {
  const { w, h } = rect.value
  return w > 0 && w < 300 && h > 0 && h < 100
})

watch(open, (value, oldValue, onCleanup) => {
  updateWindowInfo()
  if (value) {
    window.addEventListener("click", handleClickAway)
    onCleanup(() => {
      window.removeEventListener("click", handleClickAway)
    })
  }
})

watch(isMinimized, (value) => {
  const doc = pipWindow.window?.document
  const CSSStyleSheet = doc!.defaultView!.CSSStyleSheet
  if (!doc) {
    return
  }
  if (!sheet) {
    sheet = new CSSStyleSheet()
    const style = `html { overflow: hidden; }`
    sheet.replace(style)
    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet]
  }
  sheet.disabled = !value

  contentInvoke.getAllCommands().then((commands) => {
    const command = commands.find((c) => c.name == "toggleMinimize")
    if (command) {
      toggleMinimizeCommand.value = command
    }
  })

  chrome.storage.local.set({})
})

onMounted(() => {
  pipWindow.window?.addEventListener("keydown", handleKeydown)
  pipWindow.window?.addEventListener("resize", updateWindowInfo)
  updateWindowInfo()

  contentInvoke.register(ServiceFunc.toggleMinimize, () => {
    console.log("invoke toggleMinimize")
    toggleMinimize()
  })
})
onUnmounted(() => {
  pipWindow.window?.removeEventListener("keydown", handleKeydown)
  pipWindow.window?.removeEventListener("resize", updateWindowInfo)
})

function updateWindowInfo() {
  const win = pipWindow.window
  if (!win) {
    return
  }

  const { outerWidth: w, outerHeight: h, screenX: l, screenY: t } = win
  const s = win.screen
  const sw = s.width
  const sh = s.height
  const r = s.width - l - w
  const b = s.height - t - h

  if (w > 300 && h > 500) {
    normalRect.value = { w, h, l, t, r, b }
  }
  rect.value = { w, h, l, t, r, b }
}

function clickMenu(e: MouseEvent) {
  open.value = true
  if (e.ctrlKey || e.metaKey) {
    pinOpen.value = true
  }
}

function handleClickAway(e: MouseEvent) {
  const target = e.composedPath()[0] as Element
  if (wrapper.value?.contains(target)) {
    return
  }
  open.value = false
}

const menuPointerEnter = () => {
  clearTimeout(timer)
  timer = window.setTimeout(() => (open.value = true), 200)
}
const menuPointerLeave = () => {
  clearTimeout(timer)
  timer = window.setTimeout(() => (open.value = false), 200)
}

const btnPointerEnter = () => {
  clearTimeout(timer)
}

const btnPointerLeave = () => {
  if (pinOpen.value) {
    return
  }
  timer = window.setTimeout(() => (open.value = false), 350)
}

const toggleMinimize = () => {
  open.value = false
  const windowId = pipWindow.windowsWindow?.id
  if (!windowId) {
    console.log("windowId is not set", pipWindow.windowsWindow)
    return
  }

  updateWindowInfo()

  let left, top, width, height

  const s = pipWindow.window?.screen || screen
  if (!isMinimized.value) {
    // minimize
    let { r, l, t, b } = rect.value
    width = 255
    height = 94
    left = r > l ? Math.max(l, -85) : Math.min(s.width - r - 255, s.width - 170)
    top = Math.min(s.height - b - 94, s.height - 94)
  } else {
    // restore
    const { r, l, t, b } = rect.value
    const { w, h } = normalRect.value
    left = r > l ? Math.max(l, 0) : Math.min(s.width - w - r, s.width - w)
    top = Math.max(b > t ? t : s.height - h - b, 0)
    width = w
    height = h
  }

  chrome.runtime.sendMessage({
    type: MessageType.updateWindow,
    options: {
      windowId: windowId,
      windowInfo: {
        left,
        top,
        width,
        height,
      },
    },
  })
}

const moveAside = (value?: number) => {
  open.value = false
  const windowId = pipWindow.windowsWindow?.id
  if (!windowId) {
    console.log("windowId is not set", pipWindow.windowsWindow)
    return
  }

  const left =
    rect.value.r > rect.value.l ? screen.width - 60 - rect.value.w : 60

  chrome.runtime.sendMessage({
    type: MessageType.updateWindow,
    options: {
      windowId,
      windowInfo: {
        left: value || left,
      },
    },
  })
}

const close = () => {
  const win = window.documentPictureInPicture.window
  win?.close()
}

const refresh = () => {
  open.value = false
  const win = pipWindow.window
  if (win) {
    dispatchContentEvent({
      type: ContentEventType.pipLoad,
      detail: { url: win.location.href },
    })
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (isWindows ? e.ctrlKey : e.metaKey) {
    if (e.code == "KeyR") {
      return refresh()
    }

    if (e.code == "KeyM") {
      return toggleMinimize()
    }

    if (e.code == "ArrowRight") {
      return moveAside(screen.width - 60 - rect.value.w)
    }

    if (e.code == "ArrowLeft") {
      return moveAside(60)
    }
  }
}

const handleEditCommand = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  const desc = chrome.i18n.getMessage("toggle_minimize_desc")
  const text = encodeURIComponent(desc)
  contentInvoke.createTab({
    url: `chrome://extensions/shortcuts#:~:text=${text}`,
  })
}
</script>

<template>
  <div ref="wrapper">
    <button
      :class="[
        'group fixed flex top-1 left-1/2 -translate-x-1/2 gap-1 px-2 py-1.5 z-[9999]',
      ]"
      @click="clickMenu"
      @pointerenter="menuPointerEnter"
      @pointerleave="menuPointerLeave"
    >
      <div
        class="absolute w-full h-full top-0 left-0 rounded-full group-hover:backdrop-blur-sm group-hover:backdrop-invert-[5%]"
      ></div>
      <div
        v-for="i in 3"
        class="size-1.5 rounded-full backdrop-invert-[20%] group-hover:backdrop-invert-[50%]"
      ></div>
    </button>

    <div
      v-if="open"
      :class="[
        'btn-group flex flex-col top-6 left-1/2 -translate-x-1/2 px-2 py-2 gap-2 ',
        'fixed rounded-lg shadow-lg z-[9999] bg-background/65 text-foreground',
      ]"
      @pointerenter="btnPointerEnter"
      @pointerleave="btnPointerLeave"
    >
      <div v-if="0">
        <input
          autofocus
          placeholder="search"
          class="bg-background-soft border text-xs rounded h-6 leading-6 px-2"
        />
      </div>

      <button
        tabindex="1"
        class="btn-item"
        @click="toggleMinimize"
        :aria-label="t('minimize')"
      >
        <IconHide class="shrink-0 scale-95" />
        <span class="truncate">{{ t("minimize") }}</span>
        <span class="shortcut">
          <span class="key">{{ modiferKey }}</span> + <span class="key">m</span>
        </span>
      </button>
      <button
        class="btn-item"
        @click="moveAside()"
        :aria-label="t('moveAside')"
      >
        <IconSplitRight
          :class="['shrink-0 scale-95', { 'rotate-180': rect.r < rect.l }]"
        />
        <span class="truncate">{{ t("moveAside") }}</span>
        <span class="shortcut">
          <span class="key">{{ modiferKey }}</span> +
          <span class="key">{{ rect.r < rect.l ? "←" : "→" }}</span>
        </span>
      </button>
      <button class="btn-item" @click="close" :aria-label="t('close')">
        <IconClose class="shrink-0" />
        <span class="truncate">{{ t("close") }}</span>
        <span class="shortcut">
          <span class="key">{{ modiferKey }}</span> + <span class="key">w</span>
        </span>
      </button>
      <button class="btn-item" @click="refresh" :aria-label="t('refresh')">
        <IconRefresh class="shrink-0" />
        <span class="truncate">{{ t("refresh") }}</span>
        <span class="shortcut">
          <span class="key">{{ modiferKey }}</span> + <span class="key">r</span>
        </span>
      </button>
    </div>

    <div
      v-if="isMinimized"
      :class="[
        'group z-[99999] fixed w-screen h-screen bottom-0 left-0 flex gap-3 items-center ',
        'justify-center box-border px-6 bg-background/70 hover:bg-background/80 ',
        'backdrop-blur max-h-20 cursor-pointer transition',
      ]"
      @click="toggleMinimize"
    >
      <img :src="getPageIcon()" :data-fallback="globeImg" class="size-6" />
      <div class="flex flex-col flex-1 w-0">
        <div class="truncate text-sm font-bold">
          {{ pipWindow.window?.document.title || "Anything Copilot" }}
        </div>
        <div class="flex gap-2 items-center">
          <IconKeyboard class="size-4" />
          <span
            v-if="toggleMinimizeCommand?.shortcut"
            class="text-xs font-bold"
          >
            {{ toggleMinimizeCommand?.shortcut }}
          </span>
          <button v-else class="text-xs" @click="handleEditCommand">
            {{ t("setShortcutKeys") }}
          </button>
          <button
            class="hidden group-hover:flex p-0.5 -m-0.5 rounded hover:bg-background-soft"
            @click="handleEditCommand"
          >
            <IconEdit class="size-3.5" />
          </button>
        </div>
      </div>
      <img :src="logoUrl" class="absolute size-3 bottom-2 right-2" />
    </div>
  </div>
</template>

<style scoped>
.btn-group {
  backdrop-filter: blur(10px) invert(5%);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  background-color: rgba(var(--bg-rgb), 0.65);
  animation: 200ms ease-out fadein;
  max-width: 100%;
}

.btn-item {
  font-size: 14px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
}
.btn-item:hover {
  background: var(--color-background-mute);
}

.shortcut {
  letter-spacing: -0.5px;
  font-size: 12px;
  line-height: 14px;
  margin-left: auto;
  text-wrap: nowrap;
}
.shortcut .key {
  padding: 2px 4px;
  border-radius: 4px;
  background: var(--color-background-soft);
}

@keyframes fadein {
  from {
    transform: translateX(-50%) translateY(-60px) scale(50%);
    opacity: 0.2;
  }
  to {
    transform: translateX(-50%) translateY(0) scale(100%);
    opacity: 100;
  }
}
</style>
