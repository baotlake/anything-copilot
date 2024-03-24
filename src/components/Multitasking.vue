<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue"
import IconMinimize from "@/components/icons/IconMinimize.vue"
import IconSplitRight from "@/components/icons/IconSplitscreenRight.vue"
import IconClose from "@/components/icons/IconClose.vue"
import { ContentEventType, MessageType } from "@/types"
import { pipWindow } from "@/store/content"
import { throttle } from "lodash-es"
import IconRefresh from "./icons/IconRefresh.vue"
import { dispatchContentEvent } from "@/content/event"
import { useI18n } from "@/utils/i18n"
import IconHide from "./icons/IconHide.vue"

const open = ref(false)
const pinOpen = ref(false)
const timer = ref(0)
const wrapper = ref<HTMLDivElement>()
const { t } = useI18n()

const isWindows = navigator.userAgentData?.platform == "Windows"
const modiferKey = isWindows ? "ctrl" : "⌘"

const pipRect = computed(() => {
  const winInfo = pipWindow.windowsWindow
  const { width } = screen

  return {
    width: winInfo?.width || 0,
    height: winInfo?.height || 0,
    left: winInfo?.left || 0,
    right: width - (winInfo?.left || 0) - (winInfo?.width || 0),
  }
})

const updateWindowInfo = throttle(() => {
  const id = pipWindow.windowsWindow?.id
  console.log("updateWindowInfo", id)
  if (id) {
    chrome.runtime.sendMessage({
      type: MessageType.getPipWinInfo,
      options: {
        windowId: id,
      },
    })
  }
}, 3000)

const clickMenu = (e: MouseEvent) => {
  open.value = true
  if (e.ctrlKey || e.metaKey) {
    pinOpen.value = true
  }
}

const handleClickAway = (e: MouseEvent) => {
  const target = e.composedPath()[0] as Element
  if (wrapper.value?.contains(target)) {
    return
  }
  open.value = false
}

watch(open, (value, oldValue, onCleanup) => {
  value && updateWindowInfo()
  window.addEventListener("click", handleClickAway)
  onCleanup(() => {
    window.removeEventListener("click", handleClickAway)
  })
})

const menuPointerEnter = () => {
  clearTimeout(timer.value)
  timer.value = window.setTimeout(() => (open.value = true), 200)
}
const menuPointerLeave = () => {
  clearTimeout(timer.value)
  timer.value = window.setTimeout(() => (open.value = false), 200)
}

const btnPointerEnter = () => {
  clearTimeout(timer.value)
}

const btnPointerLeave = () => {
  if (pinOpen.value) {
    return
  }
  timer.value = window.setTimeout(() => (open.value = false), 350)
}

const minimize = () => {
  open.value = false
  const windowId = pipWindow.windowsWindow?.id
  if (!windowId) {
    console.log("windowId is not set", pipWindow.windowsWindow)
    return
  }
  chrome.runtime.sendMessage({
    type: MessageType.updateWindow,
    options: {
      windowId: windowId,
      windowInfo: {
        state: "minimized",
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
    pipRect.value.right > pipRect.value.left
      ? screen.width - 60 - pipRect.value.width
      : 60

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
      return minimize()
    }

    if (e.code == "ArrowRight") {
      return moveAside(screen.width - 60 - pipRect.value.width)
    }

    if (e.code == "ArrowLeft") {
      return moveAside(60)
    }
  }
}

onMounted(() => {
  pipWindow.window?.addEventListener("keydown", handleKeydown)
})
onUnmounted(() => {
  pipWindow.window?.removeEventListener("keydown", handleKeydown)
})
</script>

<template>
  <div ref="wrapper">
    <button
      class="multitasking-menu flex gap-1 px-2 py-1.5 z-[9999]"
      @click="clickMenu"
      @pointerenter="menuPointerEnter"
      @pointerleave="menuPointerLeave"
    >
      <div class="dot w-1.5 h-1.5 rounded-full"></div>
      <div class="dot w-1.5 h-1.5 rounded-full"></div>
      <div class="dot w-1.5 h-1.5 rounded-full"></div>
    </button>

    <div
      v-if="open"
      class="btn-group flex flex-col px-2 py-2 gap-2 fixed rounded-lg shadow-lg left-6 z-[9999]"
      @pointerenter="btnPointerEnter"
      @pointerleave="btnPointerLeave"
    >
      <div v-if="0">
        <input
          autofocus
          placeholder="search"
          class="search text-xs rounded h-6 leading-6 px-2"
        />
      </div>

      <button
        tabindex="1"
        class="btn-item"
        @click="minimize"
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
          :class="[
            'shrink-0 scale-95',
            { 'rotate-180': pipRect.right < pipRect.left },
          ]"
        />
        <span class="truncate">{{ t("moveAside") }}</span>
        <span class="shortcut">
          <span class="key">{{ modiferKey }}</span> +
          <span class="key">{{
            pipRect.right < pipRect.left ? "←" : "→"
          }}</span>
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
  </div>
</template>

<style scoped>
.multitasking-menu {
  top: 4px;
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
}
.multitasking-menu:hover::before {
  backdrop-filter: blur(5px) invert(5%);
}
.multitasking-menu::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  top: 0;
  left: 0;
}
.multitasking-menu:hover dot {
  backdrop-filter: invert(50%);
}
.dot {
  backdrop-filter: invert(20%);
}

.search {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
}

.btn-group {
  backdrop-filter: blur(10px) invert(5%);
  top: 24px;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  left: 50%;
  transform: translateX(-50%);
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