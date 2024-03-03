import type { ContentEventType } from "@/types"

type EventOptions =
  | {
      type: ContentEventType.pip
      detail: {
        url: string
        mode: string
      }
    }
  | {
      type: ContentEventType.pipLoad
      detail: {
        url: string
      }
    }
  | {
      type: ContentEventType.pipLoaded
      detail: {}
    }
  | {
      type: ContentEventType.escapeLoad
      detail: {
        url: string
      }
    }

export function dispatchContentEvent({ type, detail }: EventOptions) {
  const event = new CustomEvent(type, { detail })
  document.dispatchEvent(event)
}

export function addContentEventListener(
  type: ContentEventType,
  handler: (e: Event) => void
) {
  document.addEventListener(type, handler)
}

export function removeContentEventListener(
  type: ContentEventType,
  handler: (e: Event) => void
) {
  document.removeEventListener(type, handler)
}
