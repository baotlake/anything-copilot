import { ContentScriptId } from "./types"

const __DEV__ = process.env.NODE_ENV == "development"

/** Manually register in the service worker */
export const mainContentScript = {
  id: ContentScriptId.main,
  js: ["js/content-main.js"],
  runAt: "document_start",
  world: "MAIN",
  matches: ["<all_urls>"],
} satisfies chrome.scripting.RegisteredContentScript

export const allFrameScript = {
  id: ContentScriptId.frame,
  js: ["js/content-frame.js"],
  allFrames: true,
  runAt: "document_start",
  matches: ["<all_urls>"],
} satisfies chrome.scripting.RegisteredContentScript

export const defaultSidebarPath = "sidebar.html"

const manifest = {
  manifest_version: 3,
  // maximum of 45 characters
  name: "__MSG_name__",
  // edge 12 characters
  // short_name: "__MSG_short_name__",
  // no more than 132 characters
  description: "__MSG_description__",
  version: "1.2.3",
  action: {
    default_icon: {
      16: "logo.png",
      24: "logo.png",
      32: "logo.png",
    },
    default_title: "__MSG_short_name__",
    default_popup: "popup.html",
  },
  default_locale: "en",
  icons: {
    16: "logo.png",
    32: "logo.png",
    48: "logo.png",
    128: "logo.png",
  },
  author: { email: "support@ziziyi.com" },
  background: {
    service_worker: "./src/bg/index.ts",
    type: "module" as const,
  },
  content_scripts: [
    // {
    //   matches: ["<all_urls>"],
    //   js: ["src/content/main.ts"],
    //   run_at: "document_start",
    //   world: "MAIN",
    // },
    {
      matches: ["http://placeholder.ziziyi.com/*"],
      js: ["src/content/index.ts"],
      run_at: "document_start",
    },
  ],
  options_page: __DEV__ ? "sidebar.html" : undefined,
  side_panel: {
    default_path: defaultSidebarPath,
  },
  permissions: [
    "tabs",
    "scripting",
    "activeTab",
    "storage",
    "offscreen",
    "sidePanel",
    "declarativeNetRequestWithHostAccess",
    "declarativeNetRequestFeedback",
    "webNavigation",
  ],
  optional_permissions: [],
  host_permissions: ["<all_urls>"],
  minimum_chrome_version: "111",
  commands: {
    toggleMinimize: {
      suggested_key: {
        default: "Ctrl+Shift+1",
      },
      description: "__MSG_toggle_minimize_desc__",
      global: true,
    },
  },
  web_accessible_resources: [
    {
      resources: ["logo.svg"],
      matches: ["<all_urls>"],
    },
    {
      resources: ["/js/*", "/assets/*"],
      matches: ["<all_urls>"],
      use_dynamic_url: true,
    },
  ],
  content_security_policy: {
    extension_pages: __DEV__
      ? `script-src 'self' http://localhost:3000 'wasm-unsafe-eval';`
      : `script-src 'self' 'wasm-unsafe-eval'`,
  },
} satisfies Manifest as chrome.runtime.Manifest

export default manifest
