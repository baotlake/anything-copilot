import type { PDFPageProxy } from "pdfjs-dist"
import type { StructTreeContent } from "pdfjs-dist/types/src/display/api"
import VNode from "./VNode"

type TextContent = Awaited<ReturnType<PDFPageProxy["getTextContent"]>>
type StructTreeNode = Awaited<ReturnType<PDFPageProxy["getStructTree"]>>

type Annotation = {
  id: string
  subtype: string
  url: string
}

export type FlatStructItem = {
  id: string
  type: string
  roles: string[]
}

function parseStructTree(structTree?: StructTreeNode) {
  const root = new VNode("div")

  const roles: Record<string, string> = {
    Document: "main",
    NonStruct: "",
    P: "p",
    L: "ul",
    H1: "h1",
    H2: "h2",
    H3: "h3",
    H4: "h4",
    H5: "h5",
    Link: "a",
    LI: "li",
    Table: "table",
    TR: "tr",
    TH: "th",
    TD: "td",
    Figure: "figure",
  }

  const parse = (node: VNode, tree: StructTreeNode): VNode => {
    let current = node

    const { role, children } = tree
    const name = roles[role]
    if (name) {
      const n = new VNode(name)
      if (name === "figure") {
        if ("alt" in tree) {
          n.alt = tree.alt as string
        }
        // const img = new VNode('img')
        // img.alt = tree.alt as string
      }

      current.append(n)
      current = n
    }

    for (let child of children) {
      if ("role" in child) {
        parse(current, child)
        continue
      }

      if (child.type == "content") {
        const n = current.name == "figure" ? "figcaption" : "#text"
        const textNode = new VNode(n)
        textNode.id = child.id
        current.append(textNode)
      }

      if (child.type == "object" && current.name == "a") {
        current.id = child.id
      }
    }

    return node
  }

  if (structTree) {
    parse(root, structTree)
  }

  return root
}

export async function parseContent(page: PDFPageProxy) {
  const structTree = await page.getStructTree()
  const content = await page.getTextContent({
    includeMarkedContent: true,
  })
  const annotations: Annotation[] = await page.getAnnotations()

  console.log("structTree: ", structTree, content)
  const root = parseStructTree(structTree)

  for (let annotation of annotations) {
    const { id, subtype, url } = annotation
    const node = root.$(`#${id}`)
    if (node && node.name == "a" && subtype == "Link" && url) {
      node.href = url
    }
  }

  let current = root.$("body") || root
  let span: VNode | null = null
  const items = [...content.items, { type: "end" as const }]

  for (let item of items) {
    if ("type" in item && span) {
      // add span to current
      const isPureText = span.childs.every((c) => c.name == "#text")

      if (isPureText && current.name == "#text") {
        current.text = span.innerHTML
      } else {
        if (current.name == "#text") {
          current.name = "span"
        }
        current.append(span)
      }

      span = null
    }

    if ("str" in item) {
      if (!span) {
        span = new VNode("span")
      }
      const textNode = new VNode("#text")
      textNode.text = item.str
      span.append(textNode)

      if (item.hasEOL) {
        const eolNode = new VNode("#text")
        eolNode.text = "\n"
        span.append(eolNode)
        // const brNode = new VNode("br")
        // span.append(brNode)
      }

      continue
    }

    if ("type" in item && item.type == "beginMarkedContentProps") {
      const id = item.id
      const node = root.$(`#${id}`)

      if (node) {
        current = node
      }
      continue
    }

    if ("type" in item && item.type == "endMarkedContent") {
      if (current.parent) {
        current = current.parent
      }
      continue
    }
  }

  console.log(root, root.html)
  return root
}
