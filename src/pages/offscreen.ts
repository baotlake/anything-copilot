import * as pdfjs from "pdfjs-dist"
import { parseContent } from "@/utils/pdf"
import { MimeType } from "@/utils/file"
import { convertToHtml, images } from "mammoth"
import TurndownService from "turndown"
import { MessageType, ServiceFunc, type ParseDocOptions } from "@/types"
import { Tiktoken } from "tiktoken/lite"
import cl100k_base from "tiktoken/encoders/cl100k_base.json"

pdfjs.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.js"


async function parsePdf(file: File) {
  const buffer = await file.arrayBuffer()
  const task = pdfjs.getDocument(buffer)
  const pdf = await task.promise
  const service = new TurndownService({ headingStyle: "atx" })

  const contents = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const root = await parseContent(page)
    const markdown = service.turndown(root.innerHTML)
    contents.push(markdown)
  }

  return contents
}

async function parseDocx(file: File) {
  const buffer = await file.arrayBuffer()
  const result = await convertToHtml(
    { arrayBuffer: buffer },
    {
      convertImage: images.imgElement(async (img) => ({ src: "" })),
    }
  )

  console.log("result: ", result)
  const service = new TurndownService({ headingStyle: "atx" })
  const markdown = service.turndown(result.value)
  return [markdown]
}

async function parseText(file: File) {
  const reader = new FileReader()
  reader.readAsText(file)
  return new Promise<string>((resolve) => {
    reader.onload = () => {
      resolve(reader.result as string)
    }
  })
}

async function parseDoc({ type, size, url, filename }: ParseDocOptions) {
  const res = await fetch(url)
  const blob = await res.blob()

  const file = new File([blob], filename, { type })
  let contents: string[] = []

  if (type === MimeType.pdf) {
    contents = await parsePdf(file)
  } else if (type == MimeType.docx) {
    contents = await parseDocx(file)
  } else if (type === MimeType.doc) {
    // not supported
  } else if (/^text\//.test(type)) {
    const text = await parseText(file)
    contents = [text]
  }

  return contents
}

async function calcTokens(text: string) {
  const encoding = new Tiktoken(
    cl100k_base.bpe_ranks,
    cl100k_base.special_tokens,
    cl100k_base.pat_str
  )
  const tokens = encoding.encode(text)
  const length = tokens.length
  encoding.free()
  return length
}

async function tokenSlice(text: string, length: number) {
  const encoding = new Tiktoken(
    cl100k_base.bpe_ranks,
    cl100k_base.special_tokens,
    cl100k_base.pat_str
  )
  const tokens = encoding.encode(text).slice(0, length)
  const value = new TextDecoder().decode(encoding.decode(tokens))
  encoding.free()
  return value
}

async function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender
) {
  if (message?.type === MessageType.toOffscreen) {
    console.log("offscreen message: ", message, sender)
    const { func, args } = message
    let taskPromise: Promise<any> | null = null
    switch (func) {
      case ServiceFunc.parseDoc:
        taskPromise = parseDoc(...(args as [any]))
        break
      case ServiceFunc.calcTokens:
        taskPromise = calcTokens(...(args as [any]))
        break
      case ServiceFunc.tokenSlice:
        taskPromise = tokenSlice(...(args as [any, any]))
        break
    }

    if (taskPromise) {
      const result = await taskPromise
      chrome.runtime.sendMessage({
        type: MessageType.fromOffscreen,
        key: message.key,
        task: message.task,
        payload: result,
      })
    }
  }
}

chrome.runtime.onMessage.addListener(handleMessage)

// for testing purposes
document.onclick = () => {
  console.log("CLICK")
  const input = document.createElement("input")
  input.type = "file"
  input.click()

  input.oninput = (e) => {
    const files = input.files

    if (!files || files.length === 0) return

    console.log(e.type, files)
    const file = files[0]
    const url = URL.createObjectURL(file)
    const key = "" + Math.random()

    console.log("url: ", url)

    parseDoc({
      key,
      url,
      type: file.type,
      size: file.size,
      filename: file.name,
    })
  }
}
