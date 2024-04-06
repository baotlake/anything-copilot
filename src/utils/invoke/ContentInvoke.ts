import { MessageType, ServiceFunc, type ParseDocOptions } from "@/types"
import Invoke from "./Invoke"

class ContentInvoke extends Invoke {
  public async send(req: any) {
    const key = this.key
    const response = await chrome.runtime.sendMessage({
      type: MessageType.invokeRequest,
      key,
      ...req,
    })

    return { key, response }
  }

  public handleResMsg(message: any) {
    if (message?.type === MessageType.invokeResponse) {
      const { key, success, payload } = message
      this.setReturnValue(key, success, payload)
    }
  }

  public parseDoc(options: ParseDocOptions): Promise<string[]> {
    return this.invoke({
      func: ServiceFunc.parseDoc,
      args: [options],
    })
  }

  public calcTokens(text: string): Promise<number> {
    return this.invoke({
      func: ServiceFunc.calcTokens,
      args: [text],
    })
  }

  public tokenSlice(text: string, length: number): Promise<string> {
    return this.invoke({
      func: ServiceFunc.tokenSlice,
      args: [text, length],
    })
  }
}

const contentInvoke = new ContentInvoke("content")

export { ContentInvoke, contentInvoke }
