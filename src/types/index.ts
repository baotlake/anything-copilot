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
  showChatDocs = "show-chat-docs",
  frameReady = "frame-ready",
}

export enum ServiceFunc {
  parseDoc = "parse-doc",
  calcTokens = "calc-tokens",
  tokenSlice = "token-slice",
}

export type ParseDocOptions = {
  key: string
  filename: string
  type: string
  size: number
  url: string
}

export enum ContentScriptId {
  content = "content",
  main = "content-main",
  frame = "frame",
}

export enum ContentEventType {
  pip = "anything-copilot_pip",
  pipLoad = "anything-copilot_pip-load",
  pipLoaded = "anything-copilot_pip-loaded",
  escapeLoad = "anything-copilot_escape-load",
}

export enum FrameMessageType {
  frameReady = "anything-copilot_frame-ready",
  contentRun = "anything-copilot_content-run",
  escapeLoad = "anything-copilot_escape-load",
  pageInfo = "anything-copilot_page-info",
}
