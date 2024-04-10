import { MessageType, ServiceFunc, type ParseDocOptions } from "@/types"
import Invoke, { type InvokeReq } from "./Invoke"

class ContentInvoke extends Invoke {
  public async send(req: InvokeReq & { tabId?: number }) {
    const key = this.key

    if (req.tabId) {
      chrome.tabs.sendMessage(req.tabId, {
        type: MessageType.invokeRequest,
        key,
        ...req,
      })
    } else {
      chrome.runtime.sendMessage({
        type: MessageType.invokeRequest,
        key,
        ...req,
      })
    }

    return { key }
  }

  public handleResMsg(message: any) {
    if (message?.type === MessageType.invokeResponse) {
      const { key, success, value } = message
      this.setReturnValue(key, success, value)
    }
  }

  public setupOffscreen() {
    return this.invoke({
      func: ServiceFunc.setupOffscreen,
      args: [],
    })
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

  public getAllCommands(): Promise<chrome.commands.Command[]> {
    return this.invoke({
      func: ServiceFunc.getAllCommands,
      args: [],
    })
  }

  public createTab(
    properties: chrome.tabs.CreateProperties
  ): Promise<chrome.tabs.Tab> {
    return this.invoke({
      func: ServiceFunc.createTab,
      args: [properties],
    })
  }
}

const contentInvoke = new ContentInvoke("content")

export { ContentInvoke, contentInvoke }
