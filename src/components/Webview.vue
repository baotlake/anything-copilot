<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed, onUnmounted } from "vue"
import { updateFrameNetRules } from "@/utils/ext"
import {
  ContentScriptId,
  FrameMessageType,
  WindowName,
  WebviewFunc,
} from "@/types"
import { findFrameLoadUrl } from "@/utils/utils"
import { fetchDoc } from "@/content/pip"
import { WebviewInvoke } from "@/utils/invoke"

export type PageInfo = {
  url: string
  title: string
  icon: string
}

const props = defineProps<{
  url: string
  ua?: string
  preloadUrl?: string
  preloadCandidates?: string[]
}>()

const emit = defineEmits<{
  load: [PageInfo]
}>()

defineExpose({
  reload,
  goBack,
  goForward,
})

const onceCallback = new Map<string, (e: MessageEvent) => boolean>()

const frame = ref<HTMLIFrameElement>()
const frameUrl = ref("")
const pageInfo = reactive({ url: "", title: "", icon: "" })
const webviewInvoke = ref<WebviewInvoke>()

watch(
  () => props.ua,
  async (ua) => {
    const tab = await chrome.tabs.getCurrent()
    await updateFrameNetRules({
      ua: ua,
      tabIds: [tab?.id || -1],
      initiatorDomains: [chrome.runtime.id],
    })
  }
)

onMounted(() => {
  webviewInvoke.value = new WebviewInvoke("webview", frame.value!)
  window.addEventListener("message", handleFrameMessage)
  console.log("loadFrame", props.url, props.ua)
  loadFrame(props.url, props.ua)
})

onUnmounted(() => {
  window.removeEventListener("message", handleFrameMessage)
})

async function loadFrame(url: string, ua?: string) {
  const iframe = frame.value
  if (!url || !iframe) return

  const tab = await chrome.tabs.getCurrent()
  await updateFrameNetRules({
    ua: ua,
    tabIds: [tab?.id || -1],
    initiatorDomains: [chrome.runtime.id],
  })

  await chrome.scripting.updateContentScripts([
    {
      id: ContentScriptId.content,
      allFrames: true,
    },
    {
      id: ContentScriptId.main,
      allFrames: true,
    },
  ])

  frameUrl.value = url
  pageInfo.url = ""
  pageInfo.title = ""
  pageInfo.icon = ""
  const loadTimeout = 1000 * 100

  try {
    await new Promise<void>((resolve, reject) => {
      onceCallback.set(FrameMessageType.frameReady, () => {
        resolve()
        return true
      })
      iframe.onload = () => {
        setTimeout(() => reject(new Error("Frame load timeout")), loadTimeout)
      }
    })
  } catch (e) {
    console.warn(e)
    let loadUrl = ""
    if (props.preloadUrl) {
      const u = new URL(props.preloadUrl || "", props.url)
      loadUrl = u.href
    }
    if (!loadUrl && props.preloadCandidates) {
      const u = await findFrameLoadUrl(props.preloadCandidates, props.url)
      u && (loadUrl = u)
    }
    if (!loadUrl) {
      console.warn("No preload url found")
      return
    }

    try {
      frameUrl.value = loadUrl
      await new Promise<void>((resolve, reject) => {
        onceCallback.set(FrameMessageType.frameReady, () => {
          resolve()
          return true
        })
        iframe.onload = () => {
          setTimeout(() => reject(new Error("Frame load timeout")), loadTimeout)
        }
      })

      iframe.contentWindow?.postMessage(
        {
          type: FrameMessageType.escapeLoad,
          url: props.url,
        },
        "*"
      )
    } catch (e) {
      console.warn(e)
      frameUrl.value = ""
      const res = await fetchDoc(props.url)
      const html = await res.text()
      // iframe.srcdoc = html
    }
  }
}

function handleFrameMessage(e: MessageEvent) {
  console.log("frame message: ", e, e.source !== frame.value?.contentWindow)
  if (e.source !== frame.value?.contentWindow) return
  const type = e.data.type
  if (!type) return
  onceCallback.get(type)?.(e) && onceCallback.delete(type)

  switch (type) {
    case FrameMessageType.pageInfo:
      pageInfo.url = e.data.url
      pageInfo.title = e.data.title
      pageInfo.icon = e.data.icon
      emit("load", pageInfo)
      break
    case FrameMessageType.invokeResponse:
      webviewInvoke.value?.handleResMsg(e.data)
      break
  }
}

function reload() {
  console.log("reload", pageInfo.url)
  webviewInvoke.value
    ?.invoke({
      func: WebviewFunc.reload,
      args: [],
      timeout: 1000,
    })
    .catch((e) => {
      console.warn("reload failed", e)
      if (frame.value) {
        frame.value.src = pageInfo.url || props.url
      }
    })
}

function goBack() {
  console.log("goBack")
  webviewInvoke.value?.invoke({
    func: WebviewFunc.goBack,
    args: [],
  })
}

function goForward() {
  console.log("goForward")
  webviewInvoke.value?.invoke({
    func: WebviewFunc.goForward,
    args: [],
  })
}
</script>

<template>
  <iframe
    class="w-full h-full bg-white"
    ref="frame"
    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    :src="frameUrl"
    :name="WindowName.webview"
  ></iframe>
</template>

<style scoped></style>
