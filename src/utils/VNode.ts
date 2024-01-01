type VNodeName =
  | "html"
  | "body"
  | "main"
  | "div"
  | "section"
  | "p"
  | "span"
  | "b"
  | "a"
  | "#text"
  | "br"
  | "figure"
  | "figcaption"

const htmlEscape = (str: string) =>
  str.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const htmlUnescape = (str: string) =>
  str
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")

class VNode {
  public name: VNodeName
  public childs: VNode[]
  public key: string
  public text?: string
  public id?: string
  public href?: string
  public alt?: string

  #parent: VNode | null

  constructor(name: string) {
    this.name = name as VNodeName
    this.childs = []
    this.#parent = null
    this.key = ""
  }

  get innerHTML(): string {
    return this.childs.map((c) => c.html).join("")
  }

  get html(): string {
    if (this.name == "#text") {
      return htmlEscape(this.text || "")
    }

    const name = this.name
    const innerHTML = this.innerHTML

    let attr = Object.entries(this.attributes)
      .map(([k, v]) => `${k}="${htmlEscape(v)}"`)
      .join(" ")
    attr = attr ? ` ${attr} ` : ""
    const template = `<${name}${attr}>${innerHTML}</${name}>`
    return template
  }

  get parent() {
    return this.#parent
  }

  get attributes() {
    const attr: Record<string, string> = {}
    this.href && (attr.href = this.href)
    this.alt && (attr.alt = this.alt)
    return attr
  }

  public append(n: VNode) {
    if (this.name == "#text") {
      throw Error("Cannot append children within a text node")
    }

    n.#parent = this
    this.childs.push(n)
  }

  public $(selector: string): VNode | null {
    if (selector.startsWith("#") && this.id == selector.slice(1)) {
      return this
    }

    if (this.name == selector) {
      return this
    }

    for (let child of this.childs) {
      if (child instanceof VNode) {
        const n = child.$(selector)
        if (n) {
          return n
        }
      }
    }
    return null
  }
}

export default VNode
export { VNode }
