export enum MessageType {
  pip = "pip",
  hiContent = "hi-content",
  contentHere = "content-here",
  bgOpenPip = "bg-open-pip",
  bgPipLaunch = "bg-pip-launch",
  pipLaunch = "pip-launch",
  contentMounted = "content-mount",
  updateWindow = "update-window",
  removeWindow = "remove-window",
  forwardToTab = "forward-to-tab",
  invokeRequest = "invoke-request",
  invokeResponse = "invoke-Response",
  showChatDocs = "show-chat-docs",
  openInSidebar = "open-in-sidebar",
  registerContentSidebar = "register-content-sidebar",
}

export enum ServiceFunc {
  setupOffscreen = "setup-offscreen",
  parseDoc = "parse-doc",
  calcTokens = "calc-tokens",
  tokenSlice = "token-slice",
  getAllCommands = "get-all-commands",
  createTab = "create-tab",
  toggleMinimize = "toggle-minimize",
  getPipWindow = "get-pip-window",
  getMyTab = "get-my-tab",
  waitOffscreen = "wait-offscreen",
  toggleSidebar = "toggle-sidebar",
  toggleContentSidebar = "toggle-content-sidebar",
  waitSidebar = "wait-sidebar",
  openInSidebar = "open-in-sidebar",
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
  escapeLoad = "anything-copilot_escape-load",
  pageInfo = "anything-copilot_page-info",
  collapseSidebar = "anything-copilot_collapse-sidebar",
  closeSidebar = "anything-copilot_close-sidebar",
  invokeRequest = "anything-copilot_invoke-request",
  invokeResponse = "anything-copilot_invoke-response",
}

export enum WindowName {
  webview = "anything-copilot_webview",
}

export enum WebviewFunc {
  reload = "reload",
  goBack = "goBack",
  goForward = "goForward",
}
