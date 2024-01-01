import { describe, test, expect } from "vitest"
import { parseContent } from "@/utils/pdf"
import { readFile } from "node:fs/promises"
import * as pdfjs from "pdfjs-dist"
import { fileURLToPath, resolve } from "node:url"

const __dirname = resolve(fileURLToPath(import.meta.url), ".")

console.log(__dirname)

pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.mjs"

describe("utils/pdf.ts", () => {
  test("parseContent", async () => {
    const pdfBuffer = await readFile(resolve(__dirname, "./generative-ai.pdf"))
    
    const arrayBuffer = new Uint8Array(pdfBuffer)
    const task = await pdfjs.getDocument(arrayBuffer)
    const pdf = await task.promise

    const page1 = await pdf.getPage(1)

    const node = await parseContent(page1)

    console.log(node.innerHTML)

    expect(1).toBe(1)
  })
})
