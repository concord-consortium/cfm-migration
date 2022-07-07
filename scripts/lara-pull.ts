import die from "./die";
import { LaraConfig } from "./get-config";
import log from "./log";
import { connect } from "./mysql-via-ssh";
import writeFile from "./write-file";

const fromCommonMWInteractivesSql = `
  from mw_interactives mw, page_items pi, interactive_pages ip, lightweight_activities la 
  where (mw.url like '%document-store.concord.org%' or mw.url like '%autolaunch.html%') and pi.embeddable_type = 'MwInteractive' and pi.embeddable_id = mw.id 
    and pi.interactive_page_id = ip.id 
    and ip.lightweight_activity_id = la.id
`
const getMWInteractivesInfoSql = `select la.id as activityId, la.name as activityName, mw.id as mwId, mw.url as mwUrl ${fromCommonMWInteractivesSql}`

const getRunStatesSql = `
  select id, interactive_id, raw_data
  from interactive_run_states
  where interactive_type = 'MwInteractive'
    and interactive_id in(select mw.id ${fromCommonMWInteractivesSql});
`

const laraPull = (env: string, laraConfig: LaraConfig) => {
  const {ecsHost, ecsUser, ecsKey, dbHost, dbPassword} = laraConfig;

  connect({ecsHost, ecsUser, ecsKey, dbHost, dbPassword})
    .then(([conn, done]) => {
      log("Querying for mw_interactives")
      conn.query(getMWInteractivesInfoSql,
        (err, results) => {
          if (err) {
            die(err.toString())
          }
          writeFile(env, "lara-mwurls.json", results)

          log("Querying for interactive_run_states")
          conn.query(getRunStatesSql,
            (err, results) => {
              if (err) {
                die(err.toString())
              }
              const parsedResults = (results as any).map((row: any) => {
                const rawData = row.raw_data;
                delete row.raw_data;
                row.parsed_data = rawData ? JSON.parse(rawData) : rawData;
                return row;
              })
              writeFile(env, "lara-irs.json", parsedResults)
              done()
            }
          );
        }
      );
    })
    .catch(err => {
      console.error(err)
    })
};

export default laraPull;
