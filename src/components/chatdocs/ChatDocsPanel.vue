<script setup lang="ts">
import { watch, computed, reactive, ref, onMounted, watchEffect } from "vue"
import { chatDocsPanel } from "@/store"
import { contentService } from "@/utils/service"
import { convertBlobToBase64, semanticClip } from "@/utils/utils"
import ScrollView from "@/components/ScrollView.vue"
import IconArrowBack from "@/components/icons/IconArrowBack.vue"
import IconArrowRight from "../icons/IconArrowRight.vue"
import DocItem from "./DocItem.vue"
import DocInput from "./DocInput.vue"
import IconPlayCircle from "../icons/IconPlayCircle.vue"
import IconPause from "../icons/IconPause.vue"
import IconProgressActivity from "../icons/IconProgressActivity.vue"
import { sitesConfig } from "./chat"
import { query, dispatchInput, click, waitFor } from "@/utils/dom"
import { chatDocPrompt } from "@/utils/prompt"
import { useI18n } from "@/utils/i18n"

type Sheet = "" | "docSelect" | "promptTemplate"

type SnippetItem = {
  key: string
  index: number
  start: number
  end: number
  snippet: string
  length: number
}

type Selector = {
  input: string
  send: string
  wait: string
}

defineEmits(["close"])

const { t } = useI18n()
const logoUrl = chrome.runtime.getURL("/logo.svg")
const div = ref<HTMLDivElement>()
const sheet = ref<Sheet>("")
const currentDoc = ref("")
const sendTask = reactive({
  key: "",
  status: "" as "" | "running" | "done",
})

const config = reactive({
  prompt: chatDocPrompt,
  maxInput: 3000,
  maxInputType: "token" as "char" | "token",
  maxRuns: 10,
  selector: null as Selector | null,
})

const lenRate = reactive({
  tokenRate: 4,
})

const docs = computed(() => {
  const docs = Object.values(chatDocsPanel.docMap).filter(
    (doc) => !doc.removed && doc.success
  )
  return docs
})

const currentMessage = computed(() => {
  const { prompt, maxInput, maxInputType } = config
  const snippets: SnippetItem[] = []

  const rate = maxInputType == "token" ? lenRate.tokenRate : 1
  const maxInputLength = maxInput * rate - prompt.length

  for (let doc of docs.value) {
    for (let i = 0; i < doc.contents.length; i++) {
      const content = doc.contents[i]
      if (!content.selected || content.sentLength == content.data.length) {
        continue
      }

      const snippetsLength = snippets.reduce((a, c) => a + c.snippet.length, 0)
      if (snippets.length >= 1 && maxInputLength - snippetsLength < 600) {
        break
      }

      const metaList: string[] = []
      if (doc.kind == "file") {
        metaList.push(`file: ${doc.name}\n`)
      }
      if (doc.contents.length > 3) {
        metaList.push(`page: ${i + 1}\n`)
      }
      const meta = metaList.join("")

      const maxDataLength = maxInputLength - snippetsLength - meta.length - 100

      let data = content.data.slice(content.sentLength)
      data = semanticClip(data, maxDataLength)

      const snippet = `\`\`\`\`md\n${meta}\n${data}\n\`\`\`\``

      snippets.push({
        key: doc.key,
        index: i,
        start: content.sentLength,
        end: content.sentLength + data.length,
        snippet: snippet,
        length: snippet.length,
      })
    }
  }

  const pendingText = snippets.map((p) => p.snippet).join("\n\n")
  const message = pendingText ? `${prompt}\n\n${pendingText}` : ""
  const done = docs.value.length > 0 && snippets.length == 0

  return {
    done,
    message,
    snippets,
  }
})

watch(
  [config, () => currentMessage.value],
  async ([config, currentMessage]) => {
    const { message } = currentMessage
    const { maxInput, maxInputType } = config
    console.log("token limit watch started", maxInputType, message.slice(0, 10))

    if (maxInputType !== "token") return
    if (!message) return
    const tokenLength = await contentService.calcTokens(message)
    const rate = (message.length / tokenLength) * 0.95
    const exceedMaxInput = tokenLength > maxInput
    if (exceedMaxInput) {
      if (lenRate.tokenRate > rate) {
        lenRate.tokenRate = rate
      } else {
        lenRate.tokenRate *= 0.95
      }
    } else if (lenRate.tokenRate / rate < 0.6) {
      lenRate.tokenRate = rate
    }

    console.log("token limit watch: ", maxInput, tokenLength, lenRate.tokenRate)
  }
)

const copied = ref(0)

watch(
  () => chatDocsPanel.inputs,
  async (inputs, old, onCleanup) => {
    console.log("watch inputs: ", inputs)
    if (inputs) {
      for (let item of inputs) {
        if (chatDocsPanel.docMap[item.key]) {
          continue
        }

        const filename =
          typeof item.data == "string" ? item.data.slice(0, 10) : item.data.name

        chatDocsPanel.docMap[item.key] = {
          key: item.key,
          kind: item.kind,
          name: filename,
          loading: true,
          success: false,
          removed: false,
          contents: [],
        }

        const doc = chatDocsPanel.docMap[item.key]

        if (item.kind == "file" && typeof item.data != "string") {
          const url = await convertBlobToBase64(item.data)
          const results = await contentService.parseDoc({
            key: item.key,
            type: item.type,
            size: item.data.size,
            filename,
            url,
          })

          const contents = results.map((v: string) => ({
            data: v,
            selected: true,
            sentLength: 0,
          }))

          doc.loading = false
          doc.contents = contents
          doc.success = true

          console.log("result: ", results, chatDocsPanel)
        } else {
          doc.loading = false
        }
      }
    }
  },
  { immediate: true }
)

const progress = computed(() => {
  let totalCharacters = 0
  let sentCharacters = 0
  for (let doc of docs.value) {
    for (let content of doc.contents) {
      if (!content.selected) {
        continue
      }
      totalCharacters += content.data.length
      sentCharacters += content.sentLength
    }
  }

  const currentSnippetsLength = currentMessage.value.snippets.reduce(
    (a, c) => a + c.end - c.start,
    0
  )
  const pending = sentCharacters + currentSnippetsLength
  const pendingPrecent = Math.round((pending / totalCharacters) * 100) || 0
  const sentPrecent = Math.round((sentCharacters / totalCharacters) * 100) || 0

  console.log(pending, sentCharacters, totalCharacters)

  return {
    total: totalCharacters,
    sent: sentCharacters,
    pending,
    pendingPrecent,
    sentPrecent,
  }
})

onMounted(() => {
  const doc = div.value?.ownerDocument || document
  const { host, pathname } = doc.location
  const matchConfig = sitesConfig.find(
    (c) => c.host == host && c.path.test(pathname)
  )

  if (matchConfig) {
    config.maxInput = matchConfig.maxInputToken || matchConfig.maxInputLength
    config.maxInputType = matchConfig.maxInputToken ? "token" : "char"
    config.selector = matchConfig.selector
  }

  console.log("site config: ", matchConfig)
})

const openDocSelect = (key: string) => {
  sheet.value = "docSelect"
  currentDoc.value = key
}

const removeItem = (key: string) => {
  if (chatDocsPanel.docMap[key]) {
    chatDocsPanel.docMap[key].removed = true
  }
  const i = chatDocsPanel.inputs.findIndex((v) => v.key == key)
  chatDocsPanel.inputs.splice(i, 1)
}

const handleCopyMessage = () => {
  clearTimeout(copied.value)
  copied.value = window.setTimeout(() => (copied.value = 0), 2000)
  const message = currentMessage.value.message
  navigator.clipboard.writeText(message)
}

const len = async (text: string, type: "char" | "token") => {
  if (type == "token") {
    return contentService.calcTokens(text)
  }
  return text.length
}

// const setCurrent = async () => {
//   const { prompt, maxInput, maxInputType, maxRuns } = config
//   const snippets: SnippetItem[] = []
//   const promptLength = await len(prompt, maxInputType)
//   const maxInputLength = maxInput - promptLength

//   for (let doc of docs.value) {
//     for (let i = 0; i < doc.contents.length; i++) {
//       const content = doc.contents[i]
//       if (!content.selected || content.sentLength == content.data.length) {
//         continue
//       }
//       const snippetsLength = snippets.reduce((a, c) => a + c.length, 0)
//       if (snippets.length >= 1 && maxInputLength - snippetsLength < 600) {
//         break
//       }

//       const metaList: string[] = []
//       if (doc.kind == "file") {
//         metaList.push(`file: ${doc.name}\n`)
//       }
//       if (doc.contents.length > 3) {
//         metaList.push(`page: ${i + 1}\n`)
//       }
//       const meta = metaList.join("")

//       const metaLength = await len(meta, maxInputType)
//       const maxDataLength =
//         maxInputLength - prompt.length - snippetsLength - metaLength - 100

//       let data = content.data.slice(content.sentLength)
//       data = await contentService.tokenSlice(content.data, maxDataLength)

//       console.log('current data: ', data)
//       data = semanticClip(data, data.length)
//       const snippet = `\`\`\`\`md\n${meta}\n${data}\n\`\`\`\``
//       const snippetLength = await len(snippet, maxInputType)

//       snippets.push({
//         key: doc.key,
//         index: i,
//         start: content.sentLength,
//         end: content.sentLength + data.length,
//         snippet: snippet,
//         length: snippetLength,
//       })
//     }
//   }

//   const text = snippets.map((p) => p.snippet).join("\n\n")
//   const message = text ? `${prompt}\n\n${text}` : ""
//   const done = docs.value.length > 0 && snippets.length == 0

//   currentMessage.value.done = done
//   currentMessage.value.message = message
//   currentMessage.value.snippets = snippets
// }

const nextMessage = async () => {
  for (let item of currentMessage.value.snippets) {
    const content = chatDocsPanel.docMap[item.key]?.contents[item.index]
    if (content.sentLength < item.end) {
      content.sentLength = item.end
    }
  }

  // await setCurrent()
}

const autoSend = async () => {
  if (currentMessage.value.snippets.length == 0) {
    return
  }

  if (!config.selector) {
    return
  }

  let key = "" + Math.random()
  sendTask.key = key
  sendTask.status = "running"

  const isWorking = () =>
    !currentMessage.value.done &&
    sendTask.status == "running" &&
    sendTask.key == key

  while (isWorking()) {
    const message = currentMessage.value.message
    console.log(">>", message)
    await new Promise((r) => setTimeout(r, 100))

    const input = query(config.selector.input) as HTMLInputElement
    if (!input) {
      throw Error("couldn't find input element for " + config.selector.input)
    }
    await dispatchInput(input, message)
    await new Promise((r) => setTimeout(r, 200))
    await click(config.selector.send)
    await new Promise((r) => setTimeout(r, 600))
    await waitFor(config.selector.wait, 1000 * 30)
    await new Promise((r) => setTimeout(r, 200))
    await nextMessage()

    if (currentMessage.value.done) {
      sendTask.status = "done"
    }
  }
}

const togglePause = () => {
  sendTask.status = ""
}

const resetSent = () => {
  for (let doc of Object.values(chatDocsPanel.docMap)) {
    for (let content of doc.contents) {
      content.sentLength = 0
    }
  }
}
</script>

<template>
  <div ref="div" class="pb-3">
    <div class="relative">
      <!-- primary panel -->
      <ScrollView fade class="max-h-[560px] px-4">
        <div class="">
          <div class="mb-4">
            <div class="mb-2 text-base font-bold">
              {{ t("chatDocs.files") }}
            </div>
            <div class="flex flex-col gap-2">
              <template v-for="(item, key) in chatDocsPanel.docMap">
                <DocItem
                  v-if="!item.removed"
                  :item="item"
                  @remove="removeItem(key)"
                  @pick="openDocSelect(key)"
                />
              </template>

              <DocInput
                v-if="chatDocsPanel.inputs.length == 0"
                @input="(value) => (chatDocsPanel.inputs = value)"
              />
            </div>
          </div>

          <div class="mb-4">
            <div class="text-base font-bold">
              {{ t("chatDocs.msgSettings") }}
            </div>
            <div
              class="text-sm my-2 px-3 py-1 rounded-lg bg-[var(--color-background-soft)]"
            >
              <div class="flex items-center justify-between my-1">
                <span>{{ t("prompt") }}</span>
                <button
                  class="py-1 flex items-center"
                  @click="sheet = 'promptTemplate'"
                >
                  <span class="px-2">{{ t("chatDocs.editPrompt") }}</span>
                  <IconArrowRight />
                </button>
              </div>

              <div class="flex items-center justify-between my-1">
                <span
                  >{{ t("chatDocs.maxLength") }} ({{
                    config.maxInputType == "token" ? "token" : "char"
                  }})</span
                >
                <input
                  v-model="config.maxInput"
                  class="border rounded px-2 py-1 w-20"
                  type="number"
                  min="1000"
                  step="1000"
                />
              </div>
              <div class="flex items-center justify-between my-1">
                <span>{{ t("chatDocs.maxSendings") }}</span>
                <input
                  v-model="config.maxRuns"
                  class="border rounded px-2 py-1 w-20"
                  type="number"
                  min="1"
                  step="1"
                />
              </div>
            </div>
          </div>

          <div class="mb-4">
            <div class="text-base font-bold">
              {{ t("chatDocs.sendProgress") }}
            </div>

            <div
              class="text-sm px-3 my-2 py-1 rounded-lg bg-[var(--color-background-soft)]"
            >
              <div
                aria-label="progress"
                class="relative w-full h-2 my-2 rounded-full bg-foreground/10"
              >
                <div
                  class="absolute h-full rounded-full transition-all bg-primary/30"
                  :style="{
                    width: `${progress.pendingPrecent}%`,
                  }"
                ></div>
                <div
                  :class="[
                    'absolute h-full rounded-full transition-all bg-primary overflow-hidden',
                    {
                      running: sendTask.status == 'running',
                    },
                  ]"
                  :style="{
                    width: `${progress.sentPrecent}%`,
                  }"
                ></div>
              </div>
              <div class="my-2">
                <div class="flex items-center">
                  <div v-if="!currentMessage.done">
                    {{ t("message") }} {{ currentMessage.message.length }}
                    {{ t("char") }}
                  </div>
                  <div v-else>{{ t("chatDocs.sendCompleted") }}</div>
                  <span class="mx-auto"></span>
                  <div v-if="!currentMessage.done">
                    {{ progress.sent }} / {{ progress.total }}
                  </div>
                  <button
                    v-else
                    class="py-1 px-2 border rounded"
                    @click="resetSent"
                  >
                    {{ t("reset") }}
                  </button>
                </div>
              </div>
              <div v-if="!currentMessage.done" class="my-2 flex items-center">
                <div class="mr-auto">{{ t("chatDocs.msgContent") }}</div>

                <button
                  class="py-1 px-2 border ml-2 rounded"
                  @click="handleCopyMessage"
                >
                  {{ copied ? t("copied") : t("copy") }}
                </button>
                <button
                  class="py-1 px-2 border ml-2 rounded"
                  @click="nextMessage"
                >
                  {{ t("next") }}
                </button>
              </div>
              <div v-else class="my-2 flex items-center justify-between">
                <div>{{ t("chatDocs.startChatting") }}</div>
              </div>
            </div>
          </div>

          <div class="mb-0">
            <div class="flex gap-2 justify-end">
              <button
                v-if="sendTask.status == 'running'"
                class="flex items-center gap-1 px-3 py-1 bg-background-soft hover:bg-background-mute"
                @click="togglePause"
              >
                <IconPause class="w-5 h-5" />
                <span>{{ t("pause") }}</span>
              </button>
              <button
                :disabled="sendTask.status !== '' || docs.length == 0"
                :class="[
                  'font-bold flex items-center gap-1 px-3 py-1 bg-primary-300 dark:bg-primary-800',
                  'enabled:hover:bg-primary-400 enabled:dark:hover:bg-primary-700',
                ]"
                @click="autoSend"
              >
                <IconProgressActivity
                  v-if="sendTask.status == 'running'"
                  class="w-5 h-5 animate-spin"
                />
                <IconPlayCircle v-else class="w-5 h-5" />
                {{ t("chatDocs.autoSending") }}
              </button>
            </div>
          </div>
        </div>
      </ScrollView>

      <!-- Sheet UI -->
      <div
        v-if="sheet != ''"
        class="absolute w-full h-full top-0 left-0 flex flex-col bg-background"
      >
        <div class="flex items-center pt-3 px-4">
          <button
            @click="sheet = ''"
            class="flex items-center max-w-full"
            :aria-label="t('back')"
          >
            <IconArrowBack class="shrink-0" />
            <span
              v-if="sheet === 'docSelect'"
              class="mx-2 text-base font-bold truncate min-w-0"
              >{{ chatDocsPanel.docMap[currentDoc]?.name }}</span
            >
            <span
              v-else-if="sheet === 'promptTemplate'"
              class="mx-2 text-base font-bold"
            >
              {{ t("promptTemplate") }}
            </span>
          </button>
        </div>
        <ScrollView fade v-if="sheet == 'docSelect'" class="px-4">
          <p class="text-sm pb-2">{{ t("chatDocs.chooseContentRelevant") }}</p>
          <input
            class="w-full px-2 py-1 border"
            :placeholder="t('search')"
            type="text"
          />
          <div class="grid grid-cols-3 gap-3 py-3">
            <div
              v-for="(content, i) of chatDocsPanel.docMap[currentDoc]?.contents"
            >
              <div
                :title="content.data"
                :class="[
                  'w-full h-0 pb-[130%] border-2 cursor-pointer',
                  'bg-background-soft hover:border-primary/50',
                  {
                    'border-primary': content.selected,
                  },
                ]"
                @click="content.selected = !content.selected"
              ></div>
              <div class="text-sm text-center">{{ i + 1 }}</div>
            </div>
          </div>
        </ScrollView>
        <ScrollView fade v-else-if="sheet == 'promptTemplate'" class="px-4">
          <textarea
            :class="[
              'scrollbar border border-foreground/20 w-full h-36 p-2 bg-background-soft',
              'outline-none',
            ]"
            v-model="config.prompt"
          ></textarea>
          <div class="flex gap-2 justify-end my-2">
            <button class="px-2">{{ t("cancel") }}</button>
            <button class="px-2">{{ t("save") }}</button>
          </div>
        </ScrollView>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  /* border-color: var(--color-border); */
  @apply border-foreground/20;
}
*:hover {
  @apply border-foreground/30;
}

.running::before {
  content: "";
  @apply h-full w-full absolute bg-gradient-to-r from-transparent via-white/30 to-transparent to-25%;
  animation: running 1s ease-in-out 0.2s infinite;
}

@keyframes running {
  from {
    transform: translate(-24px, 0);
  }
  to {
    transform: translate(100%, 0);
  }
}
</style>
