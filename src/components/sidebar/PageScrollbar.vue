<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from "vue"

const props = defineProps<{
  class?: string
}>()

const scrollEl = ref<HTMLElement>()
const barWidth = ref(18)
const height = ref(0)
const top = ref(0)

const html = document.documentElement
let updateAt = 0
let syncAt = 0
let operate = "sync"

onMounted(() => {
  const { scrollHeight, scrollTop } = html
  height.value = scrollHeight
  top.value = scrollTop

  nextTick(() => {
    if (scrollEl.value) {
      barWidth.value += 1 - scrollEl.value.clientWidth
    }
  })

  document.addEventListener("scroll", handleScroll)
})

onUnmounted(() => {
  document.removeEventListener("scroll", handleScroll)
})

function updateScroll(e: UIEvent) {
  updateAt = e.timeStamp
  const el = e.target as HTMLElement

  if (updateAt - syncAt > 200) {
    operate = "update"
  }

  if (operate == "update") {
    // html.scrollTop = el.scrollTop
    html.scrollTo({ top: el.scrollTop, behavior: "instant" })
  }
}

function handleScroll(e: Event) {
  syncAt = e.timeStamp

  const { scrollHeight, scrollTop } = html
  height.value = scrollHeight
  top.value = scrollTop

  const bar = scrollEl.value
  if (!bar) return

  if (syncAt - updateAt > 200) {
    operate = "sync"
    barWidth.value += 1 - bar.clientWidth
  }

  if (scrollEl.value && operate == "sync") {
    scrollEl.value.scrollTop = scrollTop
  }
}
</script>

<template>
  <div
    ref="scrollEl"
    :class="['h-full overflow-y-auto', props.class]"
    :style="{ width: barWidth + 'px' }"
    @scroll="updateScroll"
  >
    <div class="w-0" :style="{ height: height + 'px' }"></div>
  </div>
</template>

<style scoped></style>
