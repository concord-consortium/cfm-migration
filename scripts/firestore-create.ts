import die from "./die";
import log from "./log";
import readJSON from "./read-json";
import writeFile from "./write-file";
import admin from "firebase-admin"
import * as crypto from "crypto";
import readKey from "./read-key";

const firestoreCreate = async (env: string) => {
  
  // load the lara-irs.json for the environment
  const irsJson = readJSON(env, "lara-irs.json")
  const laraIdsIdsToDocIds = readJSON(env, "lara-irs-to-doc-ids")
  const laraIrsIds = Object.keys(laraIdsIdsToDocIds)

  const laraIrsMap: Record<number, any> = {}
  irsJson.forEach((row: any) => {
    if (laraIdsIdsToDocIds[row.id]) {
      laraIrsMap[row.id] = row
    }
  })

  const results: any = {}
  laraIrsIds.forEach((laraIrsId: any) => {
    const {id, interactive_id, run_key, context_id, platform_id, platform_user_id} = laraIrsMap[laraIrsId]
    const recordid = laraIdsIdsToDocIds[laraIrsId]
    const key = `cfm-migrate-${laraIrsId}-${recordid}`
    results[key] = {
      irsId: id,
      run_key,
      platform_id,
      platform_user_id,
      recordId: recordid,
      mwId: interactive_id,
      firestore: null
    }
    if (platform_user_id) {
      results[key].firestore = {
        accessRules: [
          {
            platformId: platform_id,
            role: "owner",
            type: "user",
            userId: `${platform_id}/users/${platform_user_id}`
          },
          {
            contextId: context_id,
            platformId: platform_id,
            type: "context"
          }
        ],
        description: "cfm migrated attachment",
        name: key,
        tool: "interactive-attachments",
        type: "s3Folder"
      }
    } else {
      const hash = crypto.createHash("sha512")
      hash.update(`${key}-hash-salt`)
      
      results[key].firestore = {
        accessRules: [
          {
            readWriteToken: `read-write-token:cfm-migration-generated:${hash.digest("hex")}`,
            type: "readWriteToken"
          }
        ],
        description: "cfm migrated attachment",
        name: `${key}-${run_key ? run_key : "no-run-key"}`,
        tool: "interactive-attachments",
        type: "s3Folder"
      }
    }
  });

  writeFile(env, "firestore-info.json", results)

  /*
  admin.initializeApp({
    credential: admin.credential.cert(readKey(env, "token-service"))
  });
  admin.firestore().settings({
    timestampsInSnapshots: true   // this removes a deprecation warning
  });
  const db = admin.firestore();

  const keys = Object.keys(results)
  for await (const key of keys) {
    try {
      log(`Creating ${key}`)
      const docRef = db.collection(`${env}:resources`).doc(key);
      await docRef.set(results[key].firestore)
    } catch (e) {
      console.error(`Unable to create firestore doc:`, e)
    }
  }

  */
  log("Done!")
};

export default firestoreCreate;
