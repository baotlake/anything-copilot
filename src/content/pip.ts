import { type PipOptions } from "@/types/pip"
import {
  querySome,
  copyStyleSheets,
  getDomNonce,
  getTrustedHTML,
  replaceHtmlNonce,
  removePrerenderRules,
} from "@/utils/dom"
import { dispatchContentEvent } from "./event"
import { ContentEventType } from "@/types"

export function fetchDoc(input: URL | RequestInfo, init?: RequestInit) {
  const headers = {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    // "User-Agent":
    //   "Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36",
  }
  return fetch(input, {
    ...init,
    headers: {
      ...headers,
      ...init?.headers,
    },
  })
}

let initWindow = null as any

export async function pip(options: PipOptions) {
  let { mode, selector, url, isCopyStyle } = options
  url = url || location.href
  let element: Element | null = null
  if (selector) {
    mode = "move-element"
    element = querySome(selector)
  }

  const pipWindow = await window.documentPictureInPicture.requestWindow({
    width: 420,
    height: 800,
  })

  initWindow = { ...pipWindow }

  // test(pipWindow.document, pipWindow);

  if (isCopyStyle) {
    copyStyleSheets(pipWindow, document)
  }

  if (mode === "iframe") {
    const iframe = document.createElement("iframe")
    iframe.src = url
    iframe.id = ""
    iframe.setAttribute("style", "width: 100%; height: 100%; border: none;")
    pipWindow.document.body.append(iframe)
    return
  }

  if (mode === "move-element") {
    if (element) {
      pipWindow.document.body.append(element)
      return
    } else {
      throw Error("selector not found")
    }
  }

  if (mode === "write-html") {
    const res = await fetchDoc(url)
    const html = await res.text()
    writeHtml(pipWindow, html)
    navGuard(pipWindow)
    return
  }
}

export async function copilotNavigateTo(url: string) {
  const pipWindow = window.documentPictureInPicture.window
  if (!pipWindow) {
    throw Error("pipWindow not found")
  }

  const res = await fetchDoc(url)
  const html = await res.text()
  // resetWindow(pipWindow);
  pipWindow.history.replaceState(pipWindow.history.state, "", url)
  writeHtml(pipWindow, html)
}

type ReopenOptions = {
  url: string
  width?: number
  height?: number
}
/** Error: requires user activation */
export async function copilotReopen({ url, width, height }: ReopenOptions) {
  const p = window.documentPictureInPicture.window
  let w = width
  let h = height
  if (p) {
    w = w || p.innerWidth
    h = h || p.innerHeight
    p.close()
  }

  const pipWindow = await window.documentPictureInPicture.requestWindow({
    width: w,
    height: h,
  })
  const res = await fetchDoc(url)
  const html = await res.text()
  writeHtml(pipWindow, html)
  navGuard(pipWindow)
}

export function writeHtml(pipWindow: Window, html: string) {
  const nonce = getDomNonce(document)
  let escaped = replaceHtmlNonce(html, nonce)
  escaped = getTrustedHTML(escaped)

  pipWindow.document.open()
  pipWindow.document.write(escaped)
  pipWindow.document.close()
  dispatchContentEvent({ type: ContentEventType.pipLoaded, detail: {} })

  const base = document.createElement("base")
  base.target = "_blank"
  pipWindow.document.head.append(base)

  removePrerenderRules(pipWindow.document)
}

function navGuard(pipWindow: Window) {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    console.log("before unload: ", e)
    e.preventDefault()
    e.returnValue = true
  }

  const handleClick = (e: MouseEvent) => {
    const target = e.target as Element | null
    if (!target) return
    console.log("click ", e)

    const anchor = target.closest<HTMLAnchorElement>("a, [href]")
    if (!anchor) return

    const href = anchor.getAttribute("href")
    if (!href) return

    if (href.slice(0, 1) == "#") {
      e.preventDefault()
      pipWindow.location.hash = href

      return
    }

    console.log(">> href: ", href, e.defaultPrevented)

    if (
      href.startsWith(location.origin) ||
      !href.startsWith(location.protocol)
    ) {
      if (!e.defaultPrevented) {
        e.preventDefault()
        // copilotReopen({ url: new URL(anchor.href, location.origin).href });
        copilotNavigateTo(new URL(anchor.href, location.origin).href)
      }

      return
    }
  }

  pipWindow.addEventListener("beforeunload", handleBeforeUnload)
  pipWindow.addEventListener("click", handleClick)
}

function resetWindow(win: Window) {
  // const iframe = document.createElement("iframe");
  // iframe.style.display = "none";
  // win.document.body.appendChild(iframe);
  // const iframeWindow = iframe.contentWindow;
  // if (iframeWindow) {
  //   for (let k of Object.keys(win)) {
  //     if (!(k in iframeWindow)) {
  //       delete win[k as any];
  //     }
  //   }
  // }

  Object.keys(win).forEach((k) => {
    if (k == "location") return
    try {
      win[k as any] = initWindow[k]
    } catch (e) {
      console.error(e)
    }
  })

  Object.keys(win.document).forEach((k) => {
    if (k == "location") return
    try {
      win.document[k as "body"] = initWindow.document[k]
    } catch (e) {
      console.error(e)
    }
  })
}

function test(doc: Document, win: Window) {
  doc.addEventListener("DOMContentLoaded", (e) => {
    console.warn("DOMContentLoaded", e)
  })

  win.addEventListener("beforeunload", (e) => {
    console.warn("beforeunload", e)
  })

  win.addEventListener("load", (e) => {
    console.warn("load", e)
  })

  win.addEventListener("unload", (e) => {
    console.warn("unload", e)
  })
}
