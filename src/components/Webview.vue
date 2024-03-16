<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed, onUnmounted } from "vue"
import config from "@/assets/config.json"
import { getLocal, updateFrameNetRules } from "@/utils/ext"
import { ContentScriptId, FrameMessageType } from "@/types"
import { findFrameLoadUrl } from "@/utils/utils"
import { fetchDoc } from "@/content/pip"

const props = defineProps<{
  url: string
}>()

const emit = defineEmits<{
  pageInfo: [pageInfo: { url: string; title: string; icon: string }]
}>()

const frame = ref<HTMLIFrameElement>()
const patchs = reactive(config.data.webviewPatchs)
const loadUrls = reactive(config.data.loadCandidates)
const inited = ref(false)
const frameUrl = ref("")
const pageInfo = reactive({ url: "", title: "", icon: "" })

const onceCallback = new Map<string, (e: MessageEvent) => boolean>()
function handleFrameMessage(e: MessageEvent) {
  console.log("frame message: ", e, e.source !== frame.value?.contentWindow)
  if (e.source !== frame.value?.contentWindow) return
  const type = e.data.type
  if (!type) return
  onceCallback.get(type)?.(e) && onceCallback.delete(type)

  switch (type) {
    case FrameMessageType.pageInfo:
      if (!pageInfo.url) {
        pageInfo.url = e.data.url
        pageInfo.title = e.data.title
        pageInfo.icon = e.data.icon

        emit("pageInfo", pageInfo)
      }
      break
  }
}

onMounted(() => {
  getLocal({
    webviewPatchs: config.data.webviewPatchs,
    loadCandidates: config.data.loadCandidates,
  }).then(({ webviewPatchs, loadCandidates }) => {
    if (webviewPatchs) {
      patchs.splice(0, patchs.length, ...webviewPatchs)
    }
    if (loadCandidates) {
      loadUrls.splice(0, loadUrls.length, ...loadCandidates)
    }
    inited.value = true
  })

  window.addEventListener("message", handleFrameMessage)
})

onUnmounted(() => {
  window.removeEventListener("message", handleFrameMessage)
})

const patch = computed(() => {
  const url = inited.value ? props.url : ""
  const patch = patchs.find((p) => {
    try {
      return new RegExp(p.re).test(url)
    } catch (e) {
      console.error(e)
    }
    return false
  })

  return {
    url,
    ua: patch?.ua || "",
    l: patch?.l || "",
  }
})

watch(patch, async (patch) => {
  const iframe = frame.value
  if (!patch.url || !iframe) return

  const tab = await chrome.tabs.getCurrent()
  await updateFrameNetRules({
    ua: patch.ua,
    tabIds: [tab?.id || -1],
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

  frameUrl.value = patch.url
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
    const url = new URL(props.url)
    let loadUrl = url.origin + patch.l
    if (!loadUrl) {
      const u = await findFrameLoadUrl(loadUrls)
      u && (loadUrl = u)
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
  iframe.contentWindow?.postMessage(
    {
      type: FrameMessageType.contentRun,
    },
    "*"
  )
})
</script>

<template>
  <iframe class="w-full h-full bg-white" ref="frame" :src="frameUrl"></iframe>
</template>

<style scoped></style>
