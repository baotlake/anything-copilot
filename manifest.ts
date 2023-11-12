const manifest = {
  manifest_version: 3,
  name: "Anything Copilot",
  description:
    "Anything Copilot opens any page, including AI tools like ChatGPT, GPTs, Bard, and Claude, in pop-ups for multitasking.",
  version: "1.0.0",
  action: {
    default_icon: {
      16: "logo.png",
      24: "logo.png",
      32: "logo.png",
    },
    default_title: "pip",
    default_popup: "popup.html",
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
      js: ["main.js"],
      run_at: "document_start",
      world: "MAIN",
    },
    {
      matches: ["<all_urls>"],
      js: ["content.js"],
      run_at: "document_start",
    },
  ],
  options_page: "guide.html",
  permissions: ["tabs", "scripting", "activeTab"],
  host_permissions: ["<all_urls>"],
  minimum_chrome_version: "111",
  web_accessible_resources: [
    {
      resources: ["index.css"],
      matches: ["<all_urls>"],
    },
  ],
};

export default manifest;
