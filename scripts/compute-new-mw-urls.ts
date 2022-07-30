import die from "./die";
import { LaraConfig } from "./get-config";
import log from "./log";
import { connect } from "./mysql-via-ssh";
import readJSON from "./read-json";
import writeFile from "./write-file";

const computeNewMWUrls = async (env: string) => {
  const mwUrls = readJSON(env, "resolved-lara-mwurls.json")

  const allParams: any = {}

  for (const row of mwUrls) {
    row.finalUrl = null

    if (!row.resolvedUrl) {
      console.error("MISSING resolvedUrl", row.mwUrl)
      continue;
    }

    const parsedFromUrl = new URL(row.mwUrl)
    const {searchParams: fromSearchParams} = parsedFromUrl
    const server = fromSearchParams.get("server")

    if (server) {
      // some of the urls have spaces after scaling so need to check each key
      let scalingKey: string|null = null
      for (const key of fromSearchParams.keys()) {
        if (key.trim() === "scaling") {
          scalingKey = key;
        }
      }

      // scale if explicit scaling key or if launch url
      const hasScaling = (scalingKey !== null) 
        || (parsedFromUrl.pathname == "/document/launch") 
        || parsedFromUrl.pathname.match(/\/v2\/documents\/(\d+)\/launch/)
      
      fromSearchParams.delete("server")
      if (scalingKey) {
        fromSearchParams.delete(scalingKey)
      }
      // fromSearchParams.delete("buttonText")
      fromSearchParams.delete("recordid")

      const serverUrl = new URL(server)
      const {searchParams: serverSearchParams} = serverUrl
      fromSearchParams.forEach((value, name) => {
        serverSearchParams.set(name, value)
        allParams[name] = allParams[name] || 0
        allParams[name]++
      })
      serverSearchParams.set("interactiveApi", "")
      serverSearchParams.set("documentId", row.resolvedUrl)

      // https://models-resources.concord.org/question-interactives/full-screen/?wrappedInteractive=https%3A%2F%2Fsagemodeler.concord.org%2Fapp%2F%3FinteractiveApi%26documentId%3Dhttps%253A%252F%252Fcfm-shared.concord.org%252F8AYG2zT7BbZIcpQNTt9o%252Ffile.json
      // https://sagemodeler.concord.org/app/?interactiveApi&documentId=https%3A%2F%2Fcfm-shared.concord.org%2F8AYG2zT7BbZIcpQNTt9o%2Ffile.json

      row.finalUrl = serverUrl.toString().replace("interactiveApi=", "interactiveApi") // to remove trailing equals
      if (hasScaling) {
        const fullScreenUrl = new URL("https://models-resources.concord.org/question-interactives/full-screen/")
        fullScreenUrl.searchParams.set("wrappedInteractive", row.finalUrl)
        row.finalUrl = fullScreenUrl.toString()
      }
    } else {
      console.error("UNHANDLED URL", row.mwUrl)
    }
  }

  writeFile(env, "final-computed-lara-mwurls.json", mwUrls)

  console.dir(allParams)
};

export default computeNewMWUrls;
