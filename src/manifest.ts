const __DEV__ = process.env.NODE_ENV == "development"

const contentCss = "/assets/index.css"

const manifest = {
  manifest_version: 3,
  // maximum of 45 characters
  name: "__MSG_name__",
  // edge 12 characters
  // short_name: "__MSG_short_name__",
  // no more than 132 characters
  description: "__MSG_description__",
  version: "1.1.2",
  action: {
    default_icon: {
      16: "logo.png",
      24: "logo.png",
      32: "logo.png",
    },
    default_title: "__MSG_short_name__",
    default_popup: "src/pages/popup.html",
  },
  default_locale: "en",
  icons: {
    16: "logo.png",
    32: "logo.png",
    48: "logo.png",
    128: "logo.png",
  },
  author: "support@ziziyi.com",
  background: {
    service_worker: "bg.js",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["/js/content-main.js"],
      run_at: "document_start",
      world: "MAIN",
    },
    {
      matches: ["<all_urls>"],
      js: ["/js/content.js"],
      run_at: "document_start",
    },
  ],
  options_page: __DEV__ ? "/src/pages/guide.html" : "",
  permissions: ["tabs", "scripting", "activeTab", "storage", "offscreen"],
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
      resources: [contentCss, "logo.svg"],
      matches: ["<all_urls>"],
    },
  ],
  content_security_policy: __DEV__
    ? {
        extension_pages: `script-src 'self' http://localhost:3000;`,
      }
    : undefined,
}

export default manifest
