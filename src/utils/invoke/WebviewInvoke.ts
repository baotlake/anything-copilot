import { FrameMessageType } from "@/types"
import Invoke from "./Invoke"

class WebviewInvoke extends Invoke {
  private frame: HTMLIFrameElement | null = null
  constructor(name: string, frame: HTMLIFrameElement) {
    super(name)
    this.frame = frame
  }

  public async send(req: any) {
    const key = this.key
    const win = this.frame?.contentWindow
    if (!win) {
      console.warn("WebviewInvoke: frame not ready", this.frame)
    }

    win?.postMessage({ type: FrameMessageType.invokeRequest, key, ...req }, "*")
    return { key, response: null }
  }

  public handleResMsg(message: any) {
    if (message?.type === FrameMessageType.invokeResponse) {
      const { key, success, payload } = message
      this.setReturnValue(key, success, payload)
    }
  }
}

export { WebviewInvoke }
