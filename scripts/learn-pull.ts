import die from "./die";
import { LearnConfig } from "./get-config";
import log from "./log";
import { connect } from "./mysql-via-ssh";
import readJSON from "./read-json";
import writeFile from "./write-file";

const learnPull = (env: string, learnConfig: LearnConfig) => {
  const {ecsHost, ecsUser, ecsKey, dbHost, dbPassword} = learnConfig;

  const irsJson = readJSON(env, "lara-irs.json")
  const docStoreSizes = readJSON(env, "docstore-sizes.json")
  const recordIds: number[] = docStoreSizes.map((row: any) => row.id)

  // find all the records ids
  log("Gathering map of recordids to user types")
  const emails = new Set<string>()
  const recordUserMap: Record<number, {type: "user", email: string, learnUserId: string|null}|{type: "anonymous", runKey: string}> = {}
  irsJson.forEach((row:any) => {
    const recordId = row.parsed_data?.docStore?.recordid
    if (recordId && recordIds.indexOf(row.parsed_data.docStore.recordid) !== -1) {
      if (row.email) {
        recordUserMap[recordId] = {type: "user", email: row.email, learnUserId: null}
        emails.add(row.email)
      } else {
        recordUserMap[recordId] = {type: "anonymous", runKey: row.run_key}
      }
    }
  })
  log(`Created map of ${Object.keys(recordUserMap).length} runs recordids to users`)  

  connect({ecsHost, ecsUser, ecsKey, dbHost, dbPassword})
    .then(([conn, done]) => {
      log("Querying for users")
      conn.query(`select id, email from users where email in (?)`, [Array.from(emails)],
        (err, results) => {
          if (err) {
            die(err.toString())
          }

          const emailsToIds: any = {};
          (results as any).forEach((row: any) => {
            emailsToIds[row.email] = row.id
          })

          Object.keys(recordUserMap).forEach((key: any) => {
            const row = recordUserMap[key];
            if (row.type === "user") {
              row.learnUserId = emailsToIds[row.email]
            }
          })

          writeFile(env, "recordids-to-learn-users.json", recordUserMap)

          done()
        }
      );
    })
    .catch(err => {
      console.error(err)
    })
};

export default learnPull;
