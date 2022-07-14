import die from "./die";
import { DocStoreConfig } from "./get-config";
import log from "./log";
import readJSON from "./read-json";
import writeFile from "./write-file";
import { Client } from "pg"
import { writeDocstoreFile } from "./docstore-file";
import Cursor from "pg-cursor"
import { promisify } from "util";

const docStoreGetContents = async (env: string, docStoreConfig: DocStoreConfig) => {
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
  await client.connect()
  log("Querying for docstore documents to get contents")

  const cursor = client.query(new Cursor(sql))
  const promisifiedCursorRead = promisify(cursor.read.bind(cursor));

  while (true) {
    log("Reading up to 100 documents")
    const rows = await promisifiedCursorRead(100);
    log(`Read ${rows.length} documents`)
    if (rows.length === 0) {
      break;
    }

    rows.forEach(row => {
      writeDocstoreFile(env, row.document_id, row.content)
    })
  }  

  cursor.close(() => {
    client.end();
  });
};

export default docStoreGetContents;
