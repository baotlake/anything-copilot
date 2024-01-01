import * as pdfjs from "pdfjs-dist"
import { parseContent } from "@/utils/pdf"
import { convertToHtml, images } from "mammoth"
import TurndownService from "turndown"
import { MessageType, ServiceFunc } from "@/types"
// import { fileTypeFromBlob } from "file-type"
import type { ParseDocOptions } from "@/types"

pdfjs.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.js"

const service = new TurndownService({ headingStyle: "atx" })

async function parsePdf(file: File) {
  const buffer = await file.arrayBuffer()
  const task = pdfjs.getDocument(buffer)
  const pdf = await task.promise

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
  const markdown = service.turndown(result.value)
  return [markdown]
}

async function parseDoc({ type, size, url, filename }: ParseDocOptions) {
  const res = await fetch(url)
  const blob = await res.blob()

  const file = new File([blob], filename, { type })
  let contents: string[] = []

  switch (type) {
    case "application/pdf":
      contents = await parsePdf(file)
      break
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      contents = await parseDocx(file)
      break
    case "application/msword":
      break
    
  }

  return contents
}

async function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender
) {
  if (message?.type === MessageType.toOffscreen) {
    console.log("offscreen message: ", message, sender)

    let taskPromise: Promise<any> | null = null
    switch (message?.task) {
      case ServiceFunc.parseDoc:
        taskPromise = parseDoc(message.payload)
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
