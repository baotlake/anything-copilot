type Selector = string | { xpath: string }

/** Custom query function that supports shadow DOM penetration with /deep/ combinator and XPath
 * */
export function query(selector: Selector) {
  if (typeof selector === "string") {
    // Check for /deep/ combinator in the selector
    if (selector.includes("/deep/")) {
      return queryShadowDom(document.documentElement, selector.split("/deep/"))
    } else {
      return document.querySelector(selector)
    }
  } else if (selector.xpath) {
    // Handle XPath selector
    const result = document.evaluate(
      selector.xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    )
    return result.singleNodeValue as Element
  }
  return null
}

function queryShadowDom(
  el: Element | ShadowRoot,
  parts: string[]
): Element | null {
  if (parts.length == 1) {
    return el.querySelector(parts[0])
  }

  const selector = parts[0]
  if (!selector) {
    return null
  }
  for (let node of el.querySelectorAll(selector)) {
    if (!node.shadowRoot) {
      continue
    }
    const value = queryShadowDom(node.shadowRoot, parts.slice(1))
    if (!value) {
      continue
    }
    return value
  }

  return null
}

export function querySome(selectors: Selector[]) {
  for (let selector of selectors) {
    const result = query(selector)
    if (result) {
      return result
    }
  }
  return null
}

export function copyStyleSheets(pipWindow: Window, document: Document) {
  ;[...document.styleSheets].forEach((styleSheet) => {
    try {
      const cssRules = [...styleSheet.cssRules]
        .map((rule) => rule.cssText)
        .join("")
      const style = document.createElement("style")

      style.textContent = cssRules
      pipWindow.document.head.appendChild(style)
    } catch (e) {
      const link = document.createElement("link")

      link.rel = "stylesheet"
      link.type = styleSheet.type
      link.media = styleSheet.media as any
      link.href = styleSheet.href as string
      pipWindow.document.head.appendChild(link)
    }
  })
}

export function getDomNonce(doc: Document) {
  const nonce = { style: "", script: "" }

  const elements = doc.querySelectorAll<
    HTMLScriptElement | HTMLStyleElement | HTMLLinkElement
  >("[nonce")

  const isLink = (el: HTMLElement): el is HTMLLinkElement =>
    el.nodeName == "LINK"

  for (let element of elements) {
    const code = element.nonce
    if (!code) continue
    if (element.nodeName == "SCRIPT" && !nonce.script) {
      nonce.script = code
      continue
    }
    if (isLink(element) && element.as == "script" && !nonce.script) {
      nonce.script = code
      continue
    }
    if (element.nodeName == "STYLE" && !nonce.style) {
      nonce.style = code
      continue
    }
    if (
      isLink(element) &&
      element.rel?.search("stylesheet") > -1 &&
      !nonce.style
    ) {
      nonce.style = code
      continue
    }
    if (isLink(element) && element.as == "style" && !nonce.style) {
      nonce.style = code
      continue
    }
  }

  return nonce
}

export function replaceHtmlNonce(
  html: string,
  nonce: { script: string; style: string }
) {
  const replacer = (match: string, p1: string, p2: string) => {
    const isScript =
      p1 == "script" || (p1 == "link" && match.search("script") > -1)
    const isStyle =
      p1 == "style" || (p1 == "link" && match.search("style") > -1)

    let r = match
    if (isScript) {
      r = match.replace(p2, nonce.script)
    }

    if (isStyle) {
      r = match.replace(p2, nonce.style)
    }

    return r
  }

  let txt = html.replace(/<(script|style|link)\s[^>]*nonce="(.+?)"/g, replacer)
  return txt
}

export function removePrerenderRules(doc: Document) {
  const rules = doc.querySelectorAll('script[type="speculationrules"]')
  if (rules) {
    rules.forEach((s) => s.remove())
  }
}

export async function dispatchInput(
  input: HTMLInputElement | HTMLTextAreaElement,
  value: string
) {
  if (["INPUT", "TEXTAREA"].includes(input.nodeName)) {
    input.value = value
  } else if (input.contentEditable) {
    input.innerText = value
  }

  input.dispatchEvent(new Event("input", { bubbles: true }))
  input.dispatchEvent(new Event("change", { bubbles: true }))
}

export async function click(target: string) {
  const el = query(target) as HTMLElement
  el.click()
}

export async function waitFor(target: string, timeout?: number) {
  let success = false
  let count = 0
  const t0 = Date.now()

  while (!success) {
    const view = query(target)
    success = !!view
    count++
    await new Promise((r) => setTimeout(r, 200))

    if (timeout && Date.now() - t0 > timeout) {
      throw Error(`click() timeout, target: ${target} wait: ${waitFor}`)
    }
  }
}
