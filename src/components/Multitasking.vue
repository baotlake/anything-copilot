<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import IconMinimize from "@/components/icons/IconMinimize.vue";
import IconSplitRight from "@/components/icons/IconSplitscreenRight.vue";
import IconClose from "@/components/icons/IconClose.vue";
import { MessageType } from "@/types";
import { pipWindowInfo, pipWindowRef } from "@/content/store";
import { throttle } from "lodash-es";
import IconRefresh from "./icons/IconRefresh.vue";
import { PipEventName } from "@/types/pip";
import { onUnmounted } from "vue";

const open = ref(false);
const timer = ref(0);
const btns = ref<HTMLDivElement>();

const pipRight = computed(() => {
  const winInfo = pipWindowInfo.value;
  const { width } = screen;
  if (!winInfo) return 0;
  if (!winInfo.width || !winInfo.left) return 0;
  return width - winInfo.left - winInfo.width;
});

const pipLeft = computed(() => {
  const winInfo = pipWindowInfo.value;
  return winInfo?.left || 0;
});

const updateWindowInfo = throttle(() => {
  const id = pipWindowInfo.value?.id;
  console.log("updateWindowInfo", id);
  if (id) {
    chrome.runtime.sendMessage({
      type: MessageType.getPipWinInfo,
      options: {
        windowId: id,
      },
    });
  }
}, 3000);

const handleClick = (e: MouseEvent) => {
  const target = e.composedPath()[0] as Element;
  if (btns.value?.contains(target)) {
    return;
  }
  open.value = false;
};

watch(open, (value, oldValue, onCleanup) => {
  value && updateWindowInfo();
  window.addEventListener("click", handleClick);
  onCleanup(() => {
    window.removeEventListener("click", handleClick);
  });
});

const menuPointerEnter = () => {
  clearTimeout(timer.value);
  timer.value = setTimeout(() => (open.value = true), 200);
};
const menuPointerLeave = () => {
  clearTimeout(timer.value);
  timer.value = setTimeout(() => (open.value = false), 200);
};

const btnPointerEnter = () => {
  clearTimeout(timer.value);
};

const btnPointerLeave = () => {
  timer.value = setTimeout(() => (open.value = false), 350);
};

const minimize = () => {
  const windowId = pipWindowInfo.value?.id;
  if (!windowId) {
    console.log("windowId is not set", pipWindowInfo.value);
    return;
  }
  chrome.runtime.sendMessage({
    type: MessageType.updatePipWin,
    options: {
      windowId: windowId,
      windowInfo: {
        state: "minimized",
      },
    },
  });
};

const slideOver = () => {
  const windowId = pipWindowInfo.value?.id;
  if (!windowId) {
    console.log("windowId is not set", pipWindowInfo.value);
    return;
  }
  console.log("slide over: ", pipRight, pipLeft);
  const left = Math.min(Math.max(pipRight.value, 60), screen.width - 60);
  chrome.runtime.sendMessage({
    type: MessageType.updatePipWin,
    options: {
      windowId,
      windowInfo: {
        left,
      },
    },
  });
};

const close = () => {
  const win = window.documentPictureInPicture.window;
  win?.close();
};

const refresh = () => {
  const pipWindow = pipWindowRef.value;
  if (pipWindow) {
    document.dispatchEvent(
      new CustomEvent(PipEventName.loadDoc, {
        detail: { url: pipWindow.location.href },
      })
    );
  }
  // const win = window.documentPictureInPicture.window;
  // win?.close();
  // document.dispatchEvent(
  //   new CustomEvent(PipEventName.pip, {
  //     detail: {
  //       url: location.href,
  //       mode: "write-html",
  //     },
  //   })
  // );
};

const throttledRefresh = throttle(refresh, 3000);

const handleKeydown = (e: KeyboardEvent) => {
  const isWindows = navigator.userAgentData.platform == "Windows";
  if (e.code == "KeyR" && (isWindows ? e.ctrlKey : e.metaKey)) {
    throttledRefresh();
  }

  // if (e.code == "KeyM" && e.metaKey) {
  //   e.preventDefault();
  //   e.stopPropagation()
  // }
};

onMounted(() => {
  pipWindowRef.value?.addEventListener("keydown", handleKeydown);
});
onUnmounted(() => {
  pipWindowRef.value?.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <button
    class="multitasking-menu flex gap-1 px-2 py-1.5 z-[9999]"
    @click="open = true"
    @pointerenter="menuPointerEnter"
    @pointerleave="menuPointerLeave"
  >
    <div class="dot w-1.5 h-1.5 rounded-full"></div>
    <div class="dot w-1.5 h-1.5 rounded-full"></div>
    <div class="dot w-1.5 h-1.5 rounded-full"></div>
  </button>

  <div
    v-if="open"
    ref="btns"
    class="btn-group flex px-2 py-1 gap-2 fixed rounded-full left-6 z-[9999]"
    @pointerenter="btnPointerEnter"
    @pointerleave="btnPointerLeave"
    @click="open = false"
  >
    <button
      class="btn w-7 h-7 flex items-center justify-center rounded"
      @click="minimize"
      aria-label="minimize"
    >
      <IconMinimize />
    </button>
    <button
      class="btn w-7 h-7 flex items-center justify-center rounded"
      @click="slideOver"
      aria-label="slide over"
    >
      <IconSplitRight :class="{ 'rotate-180': pipRight < pipLeft }" />
    </button>
    <button
      class="btn w-7 h-7 flex items-center justify-center rounded"
      @click="close"
      aria-label="close"
    >
      <IconClose />
    </button>
    <button
      class="btn w-7 h-7 flex items-center justify-center rounded"
      @click="refresh"
      aria-label="refresh"
    >
      <IconRefresh />
    </button>
    <!-- <button @click="">forward</button>
    <button @click="">backward</button> -->
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

.btn-group {
  backdrop-filter: blur(5px) invert(5%);
  top: 12px;
  border: 1px solid var(--color-border);
  color: white;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(60, 60, 60, 0.5);
  animation: 200ms ease-out fadein;
}
.btn-group .btn {
}
.btn-group .btn:hover {
  background: rgba(30, 30, 30, 0.2);
}

@keyframes fadein {
  from {
    transform: translateX(-50%) translateY(-50%) scale(50%);
    opacity: 0.2;
  }
  to {
    transform: translateX(-50%) translateY(0) scale(100%);
    opacity: 100;
  }
}
</style>
