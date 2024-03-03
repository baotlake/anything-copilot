import { ContentEventType } from "@/types"
import { addContentEventListener } from "./event"
import { copilotNavigateTo, pip, fetchDoc, writeHtml } from "./pip"

function handlePipEvent(event: CustomEvent | Event) {
  if ("detail" in event) {
    pip(event.detail)
  }
}

function handlePipLoadDocEvent(event: CustomEvent | Event) {
  if ("detail" in event) {
    copilotNavigateTo(event.detail.url)
  }
}

async function handleEscapeLoadEvent(event: CustomEvent | Event) {
  if ("detail" in event) {
    const url = event.detail.url
    const res = await fetchDoc(url)
    const html = await res.text()
    window.history.replaceState(window.history.state, "", url)
    writeHtml(window, html)
  }
}

addContentEventListener(ContentEventType.pip, handlePipEvent)
addContentEventListener(ContentEventType.pipLoad, handlePipLoadDocEvent)
addContentEventListener(ContentEventType.escapeLoad, handleEscapeLoadEvent)
