import die from "./die";
import fileExists from "./file-exists";
import { LaraConfig } from "./get-config";
import log from "./log";
import { connect } from "./mysql-via-ssh";
import readJSON from "./read-json";
import writeFile from "./write-file";

const getRunStatesWithIdsSql = (ids: string) => `
  select irs.id, irs.interactive_id, irs.raw_data, irs.metadata, r.key as run_key, u.email, r.context_id, r.platform_id, r.platform_user_id
  from interactive_run_states irs
  left join runs r on irs.run_id = r.id
  left join users u on r.user_id = u.id
  where irs.id in (${ids})
`

const docstoreShutdown = (env: string, laraConfig: LaraConfig) => {
  const {ecsHost, ecsUser, ecsKey, dbHost, dbPassword} = laraConfig;

  if (fileExists(env, "dss-starting-lara-irs.json")) {
    const laraInfo = readJSON(env, "dss-starting-lara-irs.json")
    const updates: any = [];
    laraInfo.forEach((row: any) => {
      if (row.parsed_data?.__attachment__) {
        updates.push({
          id: row.id,
          answer: row.parsed_data,
          metadata: row.parsed_metadata
        })
      }
    });

    console.log("Found", updates.length, "updates in", laraInfo.length, "rows")

    // Use code like this to mass update the answers:

    // https://github.com/concord-consortium/question-interactives/blob/master/convert-lara-answers/src/convert-answers.ts

    // /sources/activity-player.concord.org/answers/converted-authoring.concord.org-answers-interactive_run_state_4522308

    process.exit()
  }

  const firestoreInfo = readJSON(env, "firestore-info.json")

  // get run states that should have been updated
  const ids = Object.keys(firestoreInfo).map(key => firestoreInfo[key].irsId).join(", ")

  connect({ecsHost, ecsUser, ecsKey, dbHost, dbPassword})
    .then(([conn, done]) => {
      log("Querying existing run states")
      conn.query(getRunStatesWithIdsSql(ids),
        (err, results) => {
          if (err) {
            die(err.toString())
          }
          const parsedResults = (results as any).map((row: any) => {
            const rawData = row.raw_data;
            delete row.raw_data;
            row.parsed_data = rawData ? JSON.parse(rawData) : rawData;

            const rawMetadata = row.metadata;
            delete row.metadata;
            row.parsed_metadata = rawMetadata ? JSON.parse(rawMetadata) : rawMetadata;

            return row;
          })
          writeFile(env, "dss-starting-lara-irs.json", parsedResults)
          done()
        }
      );
    })
    .catch(err => {
      console.error(err)
    })
};

export default docstoreShutdown;
