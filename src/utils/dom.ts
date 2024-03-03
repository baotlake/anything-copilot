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

export function getTrustedHTML(html: string) {
  if ("window" in globalThis) {
    const policy = window.trustedTypes.createPolicy("trustedPolicy", {
      createHTML: (str: string) => str,
    })
    return policy.createHTML(html)
  }
  return html
}

export async function dispatchInput(input: HTMLElement, value: string) {
  if (["INPUT", "TEXTAREA"].includes(input.nodeName)) {
    ;(input as HTMLInputElement).value = value
  } else if (input.contentEditable) {
    const html = value.replace(/\n/g, "<br />")
    input.innerHTML = html
  }

  input.dispatchEvent(new Event("input", { bubbles: true }))
  input.dispatchEvent(new Event("change", { bubbles: true }))
}

export function getInputValue(input: HTMLElement) {
  if (["INPUT", "TEXTAREA"].includes(input.nodeName)) {
    return (input as HTMLInputElement).value
  } else if (input.contentEditable) {
    const value = input.innerText
    return value
  }
  return ""
}

export async function click(target: string) {
  const el = query(target) as HTMLElement
  el.click()
}

export async function waitFor(
  test: (i: number) => PromiseLike<boolean> | boolean,
  options: { timeout?: number; interval?: number }
) {
  let success = false
  let count = 0
  const t0 = Date.now()
  const timeout = options.timeout || 1000 * 30
  const interval = options.interval || 600

  while (!success) {
    const result = await test(count)
    success = !!result
    count++
    await new Promise((r) => setTimeout(r, interval))

    if (timeout && Date.now() - t0 > timeout) {
      throw Error(`waitFor timeout, test: ${test}`)
    }
  }
}

export function getPageIcon() {
  const icons = document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]')
  for (let item of icons) {
    if (item.getAttribute("type") == "image/svg+xml") {
      return item.href
    }
    if (parseInt(item.getAttribute("sizes") || "0") >= 90) {
      return item.href
    }
  }

  if (icons.length) {
    return icons[0].href
  }

  return location.origin + "/favicon.ico"
}
