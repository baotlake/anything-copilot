import { MessageType, ServiceFunc, type ParseDocOptions } from "@/types"
import Invoke, { type InvokeReq, type InvokeRes } from "./Invoke"

class MessageInvoke extends Invoke {
  public async send(req: InvokeReq & { tabId?: number }) {
    const key = req.key || this.key

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

  public sendRes(res: InvokeRes, sender?: chrome.runtime.MessageSender) {
    if (!sender) {
      return
    }

    if (sender.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, {
        type: MessageType.invokeResponse,
        ...res,
      })
    } else {
      chrome.runtime.sendMessage({
        type: MessageType.invokeResponse,
        ...res,
      })
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

const messageInvoke = new MessageInvoke("content")

export { MessageInvoke, messageInvoke }
