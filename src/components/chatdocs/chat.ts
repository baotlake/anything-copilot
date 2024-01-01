export const sitesConfig = [
  {
    host: "huggingface.co",
    path: /^\/chat/,
    inputLength: 8000, // 2048 token
    selector: {
      input: "form[tabindex] textarea",
      send: 'form[tabindex] button[type="submit"]',
      wait: 'form[tabindex] button[type="submit"]:not([disabled=true])',
    },
  },
  {
    host: "chat.openai.com",
    path: /^\//,
    inputLength: 18000,
    selector: {
      input: "form textarea#prompt-textarea",
      send: "form textarea ~ button",
      wait: "form textarea ~ button",
    },
  },
  {
    host: "bard.google.com",
    path: /^\/chat/,
    inputLength: 4096,
    selector: {
      input: "input-area rich-textarea p",
      send: "input-area div[class*=send] button[class*=send]",
      wait: "input-area div[class*=send] button[class*=send]:not([hidden])",
    },
  },
  {
    host: "copilot.microsoft.com",
    path: /^\//,
    inputLength: 2048,
    selector: {
      input:
        "cib-serp /deep/ cib-action-bar /deep/ cib-text-input /deep/ textarea",
      send: "cib-serp /deep/ cib-action-bar /deep/ .bottom-right-controls button",
      wait: "cib-serp /deep/ cib-action-bar /deep/ cib-typing-indicator /deep/ button[disabled]",
    },
  },
  {
    host: "yiyan.baidu.com",
    path: /^\//,
    inputLength: 2000,
    selector: {
      input: "textarea:not(h1 ~ textarea)",
      send: 'div > span:has(svg[width="240"])',
      wait: 'div > span:has(svg[width="240"]):not([style*="display: none"])',
    },
  },
]

