export enum MessageType {
  pip = "pip",
  hiContent = "hi-content",
  contentHere = "content-here",
  bgOpenPip = "bg-open-pip",
  bgPipLaunch = "bg-pip-launch",
  pipLaunch = "pip-launch",
  contentMount = "content-mount",
  getPipWinInfo = "get-pip-win-info",
  pipWinInfo = "pip-win-info",
  updateWindow = "update-window",
  removeWindow = "remove-window",
  setupOffscreenDocument = "setup-offscreen-document",
  toOffscreen = "to-offscreen",
  fromOffscreen = "from-offscreen",
  invokeRequest = "invoke-request",
  invokeResponse = "invoke-Response",
}

export enum ServiceFunc {
  parseDoc = "parse-doc",
}

export interface InvokeRequest {
  func: string
  args: any[]
}

export interface InvokeMessage extends InvokeRequest {
  type: MessageType
  key: string
}

export type ParseDocOptions = {
  key: string
  filename: string
  type: string
  size: number
  url: string
}
