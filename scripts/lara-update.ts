import { Pool } from "mysql2";
import die from "./die";
import { LaraConfig } from "./get-config";
import log from "./log";
import { connect } from "./mysql-via-ssh";
import readJSON from "./read-json";
import writeFile from "./write-file";

const laraUpdate = async (env: string, laraConfig: LaraConfig) => {
  const {ecsHost, ecsUser, ecsKey, dbHost, dbPassword} = laraConfig;

  const firestoreInfo = readJSON(env, "firestore-info.json")
  const mwUrls = readJSON(env, "final-computed-lara-mwurls.json")
  const keys = Object.keys(firestoreInfo)

  const promiseQuery = (conn: Pool, sql: string, values?: any[]) => {
    return new Promise<any>((resolve, reject) => {
      conn.execute(sql, values, (err, results, fields) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  }

  const wait = () => new Promise(resolve => setTimeout(resolve, 10))

  connect({ecsHost, ecsUser, ecsKey, dbHost, dbPassword})
    .then(async ([conn, done]) => {
      let i = 1
      let numRows = mwUrls.length

      log(`Updating ${numRows} mw_interactives`)

      for await (const row of mwUrls) {
        let logLine = `${i} of ${numRows} (${row.mwId})`
        if (row.finalUrl) {
          if (row.finalUrl !== row.mwUrl) {
            const mwSql = `UPDATE mw_interactives SET updated_at = now(), has_report_url = false, url = ? WHERE id = ?;`
            const results = await promiseQuery(conn, mwSql, [row.finalUrl, row.mwId])
            log(`Updated ${logLine}: ${results.info}`)
            await wait()
          } else {
            log(`Skipping ${logLine} - SAME finalUrl`)  
          }
        } else {
          log(`Skipping ${logLine} - NO finalUrl`)
        }
        i++
      }

      i = 1
      numRows = keys.length
      log(`Updating ${numRows} keys`)
    
      for await (const key of keys) {
        const {irsId, run_key, platform_id, platform_user_id, firestore} = firestoreInfo[key]
        const ownerId = platform_user_id ? `${platform_id}/users/${platform_user_id}` : `run: ${run_key}`
    
        let folder = `"id":"${key}","ownerId":"${ownerId}"`
        if (firestore.accessRules[0].readWriteToken) {
          folder += `,"readWriteToken":"${firestore.accessRules[0].readWriteToken}"`
        }
        
        const irsSql = `UPDATE interactive_run_states SET updated_at = now(), raw_data = '{"__attachment__":"file.json","contentType":"application/json"}', metadata = '{"attachments":{"file.json":{"folder":{${folder}},"publicPath":"interactive-attachments/${key}/file.json","contentType":"application/json"}}}' WHERE id = ?`
        const results = await promiseQuery(conn, irsSql, [irsId])
        log(`Updated ${i} of ${numRows} (${irsId}): ${results.info}`)
        await wait()
      }

      done()
    })
    .catch(err => {
      console.error(err)
    })
};

export default laraUpdate;
