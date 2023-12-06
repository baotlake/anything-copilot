type Options = {
  id: string
  name: string
  reviews?: boolean
}

export function getChromeWebStoreUrl({ id, name, reviews }: Options) {
  const u = new URL("https://chromewebstore.google.com/")
  const slug = name.replace(/[\s/]+/g, "-") || "-"
  u.pathname = `/detail/${slug}/${id}`
  if (reviews) {
    u.pathname = u.pathname + "/reviews"
  }

  return u.href
}

export function getEdgeAddonsUrl({ id, name, reviews }: Options) {
  const u = new URL("https://microsoftedge.microsoft.com")
  const slug = name.replace(/[\s/]+/g, "-") || "-"
  u.pathname = `/addons/detail/${slug}/${id}`

  return u.href
}

export function getStoreUrl(options: Options) {
  const id = chrome.runtime.id
  if (id.startsWith("lilckelmo")) {
    return getChromeWebStoreUrl(options)
  }

  if (id.startsWith("lbeehbkc")) {
    return getEdgeAddonsUrl(options)
  }

  return getEdgeAddonsUrl({
    ...options,
    id: "lbeehbkcmjaopnlccpjcdgamcabhnanl",
  })
}
