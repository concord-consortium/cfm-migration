import die from "./die";
import log from "./log";
import readJSON from "./read-json";
import writeFile from "./write-file";
import admin from "firebase-admin"
import * as crypto from "crypto";
import readKey from "./read-key";

const mapDocIds = async (env: string) => {
  
  // load the lara-irs.json for the environment
  const irsJson = readJSON(env, "lara-irs.json")
  const docStoreSizes = readJSON(env, "docstore-sizes.json")
  const recordIds = new Set()
  docStoreSizes.forEach((row: any) => recordIds.add(row.id))

  // find all the records ids and 
  log("Gathering map of irs info to recordids")
  const docs: any = {}
  irsJson.forEach((row:any) => {
    if (row.parsed_data?.docStore) {
      const {recordid} = row.parsed_data.docStore
      if (recordid && recordIds.has(recordid)) {
        docs[row.id] = recordid
      }
    }
  })

  writeFile(env, "lara-irs-to-doc-ids", docs)
};

export default mapDocIds;
