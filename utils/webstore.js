// chrome i18n docs
const extLanguages =
  "ar\tArabic\nam\tAmharic\nbg\tBulgarian\nbn\tBengali\nca\tCatalan\ncs\tCzech\nda\tDanish\nde\tGerman\nel\tGreek\nen\tEnglish\nen_AU\tEnglish (Australia)\nen_GB\tEnglish (Great Britain)\nen_US\tEnglish (USA)\nes\tSpanish\nes_419\tSpanish (Latin America and Caribbean)\net\tEstonian\nfa\tPersian\nfi\tFinnish\nfil\tFilipino\nfr\tFrench\ngu\tGujarati\nhe\tHebrew\nhi\tHindi\nhr\tCroatian\nhu\tHungarian\nid\tIndonesian\nit\tItalian\nja\tJapanese\nkn\tKannada\nko\tKorean\nlt\tLithuanian\nlv\tLatvian\nml\tMalayalam\nmr\tMarathi\nms\tMalay\nnl\tDutch\nno\tNorwegian\npl\tPolish\npt_BR\tPortuguese (Brazil)\npt_PT\tPortuguese (Portugal)\nro\tRomanian\nru\tRussian\nsk\tSlovak\nsl\tSlovenian\nsr\tSerbian\nsv\tSwedish\nsw\tSwahili\nta\tTamil\nte\tTelugu\nth\tThai\ntr\tTurkish\nuk\tUkrainian\nvi\tVietnamese\nzh_CN\tChinese (China)\nzh_TW\tChinese (Taiwan)"

const languages = Object.fromEntries(
  extLanguages.split("\n").map((v) => v.split("\t"))
)

const edgeLanguages = {
  ...languages,
  bn: "Bangla",
  en_GB: "English (United Kingdom)",
  en_US: "English (United States)",
  sw: "Kiswahili",
  es_419: "Spanish (Latin America and the Caribbean)",
}

let codeList = Object.keys(languages)
let exclude = ["en", "zh_CN"]

const isEdge = location.host == "partner.microsoft.com"

async function main(data = window.json) {
  const faildList = []
  for (let code of codeList) {
    let key = code
    if (["en", "en_AU", "en_GB", "en_US"].includes(code)) {
      key = "en"
    }

    // he -> iw,

    const label = isEdge ? edgeLanguages[code] : languages[code]
    if (exclude.includes(code)) {
      continue
    }

    item = data[key] || data[key.replace("_", "-")]
    log("code: ", code)

    try {
      await goDetail(code)
      await sleep(800)

      if (item.desc) {
        desc = item.desc
        desc = desc.replace(/\s+😎/, "\n\n\n😎")
        desc = desc.replace(/\s+😘/, "\n\n😘")
        desc = desc.replace(/\s+😊/, "\n\n😊")
        desc = desc.replace(/\s+👻/, "\n\n👻")
        await inputDesc(desc)
      }

      if (item.terms && isEdge) {
        await inputTerms(item.terms)
      }

      await saveDraft()
      await sleep(300)
      await closeDetails()
    } catch (err) {
      log(err)
      faildList.push({ code, label, message: err.message })

      try {
        await closeDetails()
      } catch (err) {
      } finally {
        continue
      }
    }
  }

  log("faildList: ", faildList)
}

async function sleep(timeout) {
  return new Promise((r) => setTimeout(r, timeout))
}

function log(...args) {
  console.warn(...args)
}

async function click({ target, waitFor }) {
  const el = document.querySelector(target)
  el.click()

  if (!waitFor) {
    return
  }

  let success = false
  let count = 0

  while (!success) {
    const view = document.querySelector(waitFor)
    success = !!view
    count++
    await sleep(150)

    if (count % 30 == 0) {
      el.click()
    }

    log("waiting for: ", waitFor)
  }
}

async function dispatchInput(input, value) {
  input.value = value
  input.dispatchEvent(new Event("input", { bubbles: true }))
  input.dispatchEvent(new Event("change", { bubbles: true }))
}

async function goDetail(code) {
  if (isEdge) {
    const label = edgeLanguages[code]
    await click({
      target: `#extensionListTable #edit-button[aria-label*="${label}"]`,
    })

    return
  }

  const tag = code.replace("_", "-")
  await click({
    target: `ul[aria-label="Language"] li[data-value="${tag}"]`,
  })
}

async function inputDesc(desc) {
  if (isEdge) {
    const textarea = document.querySelector(
      'textarea[aria-label*="Description"]'
    )
    dispatchInput(textarea, desc)

    return
  }

  const textarea = document.querySelector("article section label textarea")
  dispatchInput(textarea, desc)
}

async function saveDraft() {
  if (!isEdge) {
    return
  }

  await click({
    target: ".command-bar-right he-button:nth-child(1)",
    waitFor: ".alert.alert-success",
  })
}

async function closeDetails() {
  if (!isEdge) {
    return
  }

  await click({
    target: ".command-bar-right he-button:nth-child(2)",
    waitFor: "#extensionListTable",
  })
}
