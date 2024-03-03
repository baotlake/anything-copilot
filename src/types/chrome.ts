declare namespace chrome.declarativeNetRequest {
  export function getSessionRules(filter: {
    ruleIds: number[]
  }): Promise<Rule[]>
}

declare interface Manifest extends chrome.runtime.ManifestV3 {
  web_accessible_resources: Array<{
    resources: string[]
    matches: string[]
    use_dynamic_url?: boolean
  }>
}
