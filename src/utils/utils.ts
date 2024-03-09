export const convertBlobToBase64 = (blob: Blob) => {
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onloadend = () => {
      const base64data = reader.result as string
      resolve(base64data)
    }
  })
}

export const semanticClip = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text
  }

  let breakPoint = maxLength
  let breakScore = 0

  for (let i = maxLength; i > 0; i--) {
    if (maxLength - i > 500 || (maxLength - i) / maxLength > 0.2) {
      break
    }

    let scoreBase = 0
    let char = text[i]

    if (text[i] == "\n") {
      scoreBase = 8
    } else if ([".", "?", "!"].includes(char) && text[i + 1] == " ") {
      scoreBase = 5
    } else if (["。", "？", "！"].includes(char)) {
      scoreBase = 5
    } else if ([";", "；", ","].includes(char)) {
      scoreBase = 2
    } else if (char == " ") {
      scoreBase = 0.5
    }

    if (scoreBase) {
      let point = i + 1
      let score = scoreBase * (1000 / (maxLength - i + 1000))

      if (score > breakScore) {
        breakPoint = point
        breakScore = score
      }
    }
  }

  return text.slice(0, breakPoint)
}

/** Find URL from the same origin that can be embedded */
export async function findFrameLoadUrl(urls: string[]): Promise<string> {
  const abortController = new AbortController()

  let resolve: null | ((url: string) => void) = null
  const value = new Promise<string>((r) => {
    resolve = r
  })

  function checkCSP(csp?: string | null) {
    if (!csp) return true
    return !csp.includes("frame-ancestors")
  }

  const promises = urls.map((url) =>
    fetch(url, {
      signal: abortController.signal,
    })
      .then((res) => {
        const h = res.headers
        const xFrameOptions = h.get("X-Frame-Options")
        const csp = h.get("Content-Security-Policy")
        if (!xFrameOptions && checkCSP(csp)) {
          resolve && resolve(url)
          abortController.abort()
        }
      })
      .catch(() => {})
  )

  Promise.all(promises).then(() => {
    resolve && resolve("")
  })

  return value
}
