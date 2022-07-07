import die from "./die";
import { DocStoreConfig } from "./get-config";
import log from "./log";
import readJSON from "./read-json";
import writeFile from "./write-file";
import { Client } from "pg"

const docStoreGetSizes = (env: string, docStoreConfig: DocStoreConfig) => {
  const {dbHost, dbPassword, dbUser, dbDatabase} = docStoreConfig;
  
  // load the lara-irs.json for the environment
  const irsJson = readJSON(env, "lara-irs.json")

  // find all the records ids
  log("Gathering map of run state ids to docstore recordids")
  const recordMap: Record<number, number> = {}
  irsJson.forEach((row:any) => {
    if (row.parsed_data?.docStore?.recordid) {
      recordMap[row.id] = row.parsed_data.docStore.recordid
    }
  })
  log(`Created map of ${Object.keys(recordMap).length} runs state ids to recordids`)

  // get the unique record ids
  const recordIds = Array.from(new Set(Object.values(recordMap)));
  log(`Found ${recordIds.length} unique recordids`)
  // console.log(recordIds)
  
  const sql = `
    select d.id, pg_column_size(dc.content) as size
    from documents d, document_contents dc
    where
      d.id = dc.document_id
      and d.id in (${recordIds})
  `
  // const sql = `select id from documents where id in (${recordIds})`

  const client = new Client({
    user: dbUser,
    database: dbDatabase,
    password: dbPassword,
    host: dbHost,
    ssl: {
      rejectUnauthorized: false
    }
  })

  log("Connecting to docstore database")
  client.connect()
    .then(() => {
      log("Querying for docstore documents to get sizes")
      return client.query(sql)
    })
    .then((result) => {
      log(`Found ${result.rows.length} results in docstore database`)
      writeFile(env, "docstore-sizes.json", result.rows)
    })
    .then(() => client.end())
    .catch(err => die(err))
};

export default docStoreGetSizes;
