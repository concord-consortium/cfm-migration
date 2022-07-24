import readJSON from "./read-json";
import writeFile from "./write-file";

const categorizeUrls = (env: string) => {
  const mwUrlsJson = readJSON(env, "lara-mwurls.json")

  const domains: any = {}

  mwUrlsJson.forEach((row: any) => {
    const url = new URL(row.mwUrl)
    const domain = url.host
    let pathname = url.pathname

    if (domain === "document-store.concord.org" && pathname === "/document/launch") {
      console.log(row.mwUrl)
    }

    if (pathname.match(/\/v2\/documents\/(\d+)\/launch/)) {
      pathname = "/v2/documents/XXXX/launch"
    }
    domains[domain] = domains[domain] || {paths: {}}
    const entry = domains[domain].paths[pathname] = domains[domain].paths[pathname] || {count: 0, params: {}}
    entry.count++
    for (let key of url.searchParams.keys()) {
      key = key.trim()
      entry.params[key] = entry.params[key] || 0
      entry.params[key]++
    }
  })

  writeFile(env, "categorized-lara-myurls.json", domains)
}

export default categorizeUrls;