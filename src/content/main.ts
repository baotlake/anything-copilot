import { addContentEventListener } from "./event"
import { copilotNavigateTo, pip } from "./pip"

function handlePipEvent(event: CustomEvent | Event) {
  if ("detail" in event) {
    pip(event.detail)
  }
}

function handleLoadDocEvent(event: CustomEvent | Event) {
  if ("detail" in event) {
    copilotNavigateTo(event.detail.url)
  }
}

addContentEventListener('pip', handlePipEvent)
addContentEventListener('load-doc', handleLoadDocEvent)
