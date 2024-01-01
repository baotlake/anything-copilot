import {
  MessageType,
  type InvokeRequest,
  type ParseDocOptions,
  ServiceFunc,
} from "@/types"
import Invoke from "./Invoke"

class Service extends Invoke {
  public async send(req: any) {
    const key = this.key
    const response = await chrome.runtime.sendMessage({
      type: MessageType.invokeRequest,
      key,
      ...req,
    })

    return { key, response }
  }

  public handleMessage(message: any) {
    if (message?.type === MessageType.invokeResponse) {
      const { key, success, payload } = message
      this.setReturnValue(key, success, payload)
    }
  }

  public async invoke(req: InvokeRequest): Promise<any> {
    return super.invoke(req)
  }

  public parseDoc(options: ParseDocOptions): Promise<string[]> {
    return this.invoke({
      func: ServiceFunc.parseDoc,
      args: [options],
    })
  }
}

const contentService = new Service("content")

export { Service, contentService }
