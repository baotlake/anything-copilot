declare namespace chrome.declarativeNetRequest {
  export function getSessionRules(filter: {
    ruleIds: number[]
  }): Promise<Rule[]>
}

declare interface ManifestPatch {
  web_accessible_resources: Array<{
    resources: string[]
    matches: string[]
    use_dynamic_url: boolean
  }>
}

type Manifest = chrome.runtime.ManifestV3 & ManifestPatch
