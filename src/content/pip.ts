import type { PipOptions } from "@/types/pip";
import {
  querySome,
  copyStyleSheets,
  getDomNonce,
  replaceHtmlNonce,
  removePrerenderRules,
} from "@/utils/dom";

export const pipEventName = "anything-copilot-pip";

function fetchDoc(input: URL | RequestInfo, init?: RequestInit) {
  const headers = {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  };
  return fetch(input, {
    ...init,
    headers: {
      ...headers,
      ...init?.headers,
    },
  });
}

export async function pip(options: PipOptions) {
  let { mode, selector, url, isCopyStyle } = options;
  url = url || location.href;
  let element: Element | null = null;
  if (selector) {
    mode = "move-element";
    element = querySome(selector);
  }

  const pipWindow = await window.documentPictureInPicture.requestWindow({
    width: 350,
    height: 800,
  });

  if (isCopyStyle) {
    copyStyleSheets(pipWindow, document);
  }

  if (mode === "iframe") {
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.id = "";
    iframe.setAttribute("style", "width: 100%; height: 100%; border: none;");
    pipWindow.document.body.append(iframe);
    return;
  }

  if (mode === "move-element") {
    if (element) {
      pipWindow.document.body.append(element);
      return;
    } else {
      throw Error("selector not found");
    }
  }

  if (mode === "write-html") {
    const res = await fetchDoc(url);
    const html = await res.text();
    writeHtml(pipWindow, html);
    navGuard(pipWindow);
    return;
  }
}

export async function copilotNavigateTo(url: string) {
  const pipWindow = window.documentPictureInPicture.window;
  if (!pipWindow) {
    throw Error("pipWindow not found");
  }

  const res = await fetchDoc(url);
  const html = await res.text();
  writeHtml(pipWindow, html);
  navGuard(pipWindow);
  history.replaceState(null, "", url);
}

type ReopenOptions = {
  url: string;
  width?: number;
  height?: number;
};
/** Error: requires user activation */
export async function copilotReopen({ url, width, height }: ReopenOptions) {
  const p = window.documentPictureInPicture.window;
  let w = width;
  let h = height;
  if (p) {
    w = w || p.innerWidth;
    h = h || p.innerHeight;
    p.close();
  }

  const pipWindow = await window.documentPictureInPicture.requestWindow({
    width: w,
    height: h,
  });
  const res = await fetchDoc(url);
  const html = await res.text();
  writeHtml(pipWindow, html);
  navGuard(pipWindow);
}

function writeHtml(pipWindow: Window, html: string) {
  const nonce = getDomNonce(document);
  let escaped = replaceHtmlNonce(html, nonce);

  if (window.trustedTypes) {
    const escapeHTMLPolicy = window.trustedTypes.createPolicy("escapePolicy", {
      createHTML: (string: string) => string,
    });
    escaped = escapeHTMLPolicy.createHTML(escaped);
  }

  pipWindow.document.open();
  pipWindow.document.write(escaped);
  pipWindow.document.close();

  const base = document.createElement("base");
  base.target = "_blank";
  pipWindow.document.head.append(base);

  removePrerenderRules(pipWindow.document);
}

function navGuard(pipWindow: Window) {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    console.log("before unload: ", e);
    e.preventDefault();
    e.returnValue = true;
  };

  const handleClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (!target) return;
    console.log("click ", e);

    const anchor = target.closest<HTMLAnchorElement>("a, [href]");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href) return;

    if (href.slice(0, 1) == "#") {
      e.preventDefault();
      pipWindow.location.hash = href;

      return;
    }

    console.log(">> href: ", href, e.defaultPrevented);

    if (
      href.startsWith(location.origin) ||
      !href.startsWith(location.protocol)
    ) {
      if (!e.defaultPrevented) {
        e.preventDefault();
        // copilotReopen({ url: new URL(anchor.href, location.origin).href });
        copilotNavigateTo(new URL(anchor.href, location.origin).href);
      }

      return;
    }
  };

  pipWindow.addEventListener("beforeunload", handleBeforeUnload);
  pipWindow.addEventListener("click", handleClick);
}
