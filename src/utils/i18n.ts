import { createI18n, useI18n as vueUseI18n } from "vue-i18n"
import messages from "@intlify/unplugin-vue-i18n/messages"
import type EnMessage from "@/locales/en.json"

type MessageSchema = typeof EnMessage

export function getLocale() {
  const language = chrome.i18n.getUILanguage()
  let code = language
  if (["en-AU", "en-GB", "en-US"].includes(code)) {
    code = "en"
  }
  code = code.replace("_", "-")

  if (!code) {
    code = "en"
  }

  return code
}

export const i18n = createI18n<[MessageSchema], string>({
  legacy: false,
  locale: getLocale(),
  messages: messages as { [key: string]: MessageSchema },
})

export function useI18n() {
  return vueUseI18n<{ message: MessageSchema }>({ useScope: "global" })
}
