import die from "./die";
import { LaraConfig } from "./get-config";
import log from "./log";
import { connect } from "./mysql-via-ssh";
import readJSON from "./read-json";
import writeFile from "./write-file";

const laraUpdate = async (env: string, laraConfig: LaraConfig) => {
  const {ecsHost, ecsUser, ecsKey, dbHost, dbPassword} = laraConfig;

  const firestoreInfo = readJSON(env, "firestore-info.json")
  const mwUrls = readJSON(env, "lara-mwurls.json")

  const urlsById: any = {}
  mwUrls.forEach((row: any) => urlsById[row.mwId] = row.mwUrl)

  const keys = Object.keys(firestoreInfo)
  const urlsToConvert: any = {}
  for (const key of keys) {
    const {mwId} = firestoreInfo[key]
    const fromUrl: string = urlsById[mwId]

    if (fromUrl && !urlsToConvert[mwId]) {
      let toUrl: string|null = null
      const parsedFromUrl = new URL(fromUrl)

      // if (fromUrl.match(/https:\/\/cloud-file-manager\.concord.org\/autolaunch\/autolaunch\.html/)) {
      if ((parsedFromUrl.hostname === "document-store.concord.org") || (parsedFromUrl.hostname === "cloud-file-manager.concord.org") && parsedFromUrl.pathname.includes("autolaunch.html")) {
        const {searchParams: fromSearchParams} = new URL(fromUrl)
        const server = fromSearchParams.get("server")
        if (server) {
          // some of the urls have spaces after scaling so need to check each key
          let scalingKey: string|null = null
          for (const key of fromSearchParams.keys()) {
            if (key.trim() === "scaling") {
              scalingKey = key;
            }
          }
          const hasScaling = scalingKey !== null
          
          // TODO: what about scaling?

          fromSearchParams.delete("server")
          if (scalingKey) {
            fromSearchParams.delete(scalingKey)
          }

          const serverUrl = new URL(server)
          const {searchParams: serverSearchParams} = serverUrl
          serverSearchParams.set("interactiveApi", "")
          fromSearchParams.forEach((value, name) => {
            serverSearchParams.set(name, value)
          })

          toUrl = serverUrl.toString().replace("interactiveApi=", "interactiveApi") // to remove trailing equals
          if (hasScaling) {
            const fullScreenUrl = new URL("https://models-resources.concord.org/question-interactives/full-screen/")
            fullScreenUrl.searchParams.set("wrappedInteractive", toUrl)
            toUrl = fullScreenUrl.toString()
          }
        }
      } else if (parsedFromUrl.hostname === "document-store.concord.org") {
        const matches = parsedFromUrl.pathname.match(/\/v2\/documents\/(\d+)\/launch/)
        // console.log(fromUrl)
        if (matches) {

        } else {
          console.error("UNHANDLED URL", parsedFromUrl.pathname);
        }
      } else {
        console.error("UNHANDLED URL", fromUrl)
      }

      if (toUrl) {
        urlsToConvert[mwId] = {
          fromUrl,
          toUrl
        }
      }
    }
  }
  
  /*

  writeFile(env, "lara-mwurls-to-convert.json", urlsToConvert)

  for await (const id of Object.keys(urlsToConvert)) {
    const mwSql = `update mw_interactives set has_report_url = false, url = '${urlsToConvert[id].toUrl}' where id = ${id};`
    console.log(mwSql)
  }

  for await (const key of keys) {
    const {irsId, run_key, platform_id, platform_user_id, firestore} = firestoreInfo[key]
    const ownerId = platform_user_id ? `${platform_id}/users/${platform_user_id}` : run_key

    let folder = `"id":"${key}","ownerId":"${ownerId}"`
    if (firestore.accessRules[0].readWriteToken) {
      folder += `,"readWriteToken":"${firestore.accessRules[0].readWriteToken}"`
    }
    
    const irsSql = `update interactive_run_states set raw_data = '{"__attachment__":"file.json","contentType":"application/json"}', metadata = '{"attachments":{"file.json":{"folder":{${folder}},"publicPath":"interactive-attachments/${key}/file.json","contentType":"application/json"}}}' where id = ${irsId};`
    console.log(irsSql)
  }
  */

      /*

  connect({ecsHost, ecsUser, ecsKey, dbHost, dbPassword})
    .then(([conn, done]) => {

      TODO: change to async version of mysql (https://www.npmjs.com/package/mysql2-async)

      conn.beginTransaction(err => {
        if (err) {
          die(`Cannot start transaction: ${err.toString()}`)
        }

        log("Updating mw_interactives")

        for await (const id of Object.keys(urlsToConvert)) {
          const mwSql = `update mw_interactives set has_report_url = false, url = '${urlsToConvert[id].toUrl}' where id = ${id}`
          console.log(mwSql)
        }
      
        for await (const key of keys) {
          const {irsId, run_key, platform_id, platform_user_id, firestore} = firestoreInfo[key]
          const ownerId = platform_user_id ? `${platform_id}/users/${platform_user_id}` : `run: ${run_key}`
      
          let folder = `"id":"${key}","ownerId":"${ownerId}"`
          if (firestore.accessRules[0].readWriteToken) {
            folder += `,"readWriteToken":"${firestore.accessRules[0].readWriteToken}"`
          }
          
          const irsSql = `update interactive_run_states set raw_data = '{"__attachment__":"file.json","contentType":"application/json"}', metadata = '{"attachments":{"file.json":{"folder":{${folder}},"publicPath":"interactive-attachments/${key}/file.json","contentType":"application/json"}}}' where id = ${irsId}`
          console.log(irsSql)
        }

        done()
      });

      done()
    })
    .catch(err => {
      console.error(err)
    })
  */
};

export default laraUpdate;
