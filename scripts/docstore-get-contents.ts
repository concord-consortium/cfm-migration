import die from "./die";
import { DocStoreConfig } from "./get-config";
import log from "./log";
import readJSON from "./read-json";
import writeFile from "./write-file";
import { Client } from "pg"
import { writeDocstoreFile } from "./docstore-file";

const docStoreGetContents = (env: string, docStoreConfig: DocStoreConfig) => {
  const {dbHost, dbPassword, dbUser, dbDatabase} = docStoreConfig;
  
  const docStoreSizes = readJSON(env, "docstore-sizes.json")

  const recordIds = docStoreSizes.map((row: any) => row.id)

  const sql = `
    select document_id, content
    from document_contents
    where document_id in (${recordIds})
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
      log("Querying for docstore documents to get contents")
      return client.query(sql)
    })
    .then((result) => {
      log(`Found ${result.rows.length} results in docstore database`)
      result.rows.forEach(row => {
        writeDocstoreFile(env, row.document_id, row.content)
      })
      writeFile(env, "docstore-contents.json", result.rows)
    })
    .then(() => client.end())
    .catch(err => die(err))
};

export default docStoreGetContents;
