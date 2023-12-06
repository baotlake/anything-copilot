type EventOptions =
  | {
      type: "pip"
      detail: {
        url: string
        mode: string
      }
    }
  | {
      type: "load-doc"
      detail: {
        url: string
      }
    }
  | {
      type: "loaded"
      detail: {}
    }

type EventType = EventOptions["type"]

function getRealType(type: string) {
  return "anything-copilot_" + type
}

export function dispatchContentEvent({ type, detail }: EventOptions) {
  const event = new CustomEvent(getRealType(type), { detail })
  document.dispatchEvent(event)
}

export function addContentEventListener(
  type: EventType,
  handler: (e: Event) => void
) {
  document.addEventListener(getRealType(type), handler)
}

export function removeContentEventListener(
  type: EventType,
  handler: (e: Event) => void
) {
  document.removeEventListener(getRealType(type), handler)
}
