import die from "./die";
import { LaraConfig } from "./get-config";
import log from "./log";
import { connect } from "./mysql-via-ssh";
import writeFile from "./write-file";

//  or mw.url like '%https://codap.concord.org/app/static%'
const fromCommonMWInteractivesSql = `
  from mw_interactives mw, page_items pi, interactive_pages ip, lightweight_activities la 
  where (mw.url like '%document-store.concord.org%' or mw.url like '%autolaunch.html%') and pi.embeddable_type = 'MwInteractive' and pi.embeddable_id = mw.id 
    and pi.interactive_page_id = ip.id 
    and ip.lightweight_activity_id = la.id
`
const getMWInteractivesInfoSql = `select la.id as activityId, la.name as activityName, la.runtime, mw.id as mwId, mw.url as mwUrl ${fromCommonMWInteractivesSql}`

const getAllRunStatesSql = `
  select irs.id, irs.interactive_id, irs.raw_data, irs.metadata, r.key as run_key, u.email, r.context_id, r.platform_id, r.platform_user_id
  from interactive_run_states irs
  left join runs r on irs.run_id = r.id
  left join users u on r.user_id = u.id
  where irs.interactive_type = 'MwInteractive'
    and irs.interactive_id in(select mw.id ${fromCommonMWInteractivesSql})
`

const getRunStatesWithIdsSql = (ids: string) => `
  select irs.id, irs.interactive_id, irs.raw_data, irs.metadata, r.key as run_key, u.email, r.context_id, r.platform_id, r.platform_user_id
  from interactive_run_states irs
  left join runs r on irs.run_id = r.id
  left join users u on r.user_id = u.id
  where irs.id in (${ids})
`

const laraPull = (env: string, laraConfig: LaraConfig) => {
  const {ecsHost, ecsUser, ecsKey, dbHost, dbPassword, irsIdFilter} = laraConfig;

  connect({ecsHost, ecsUser, ecsKey, dbHost, dbPassword})
    .then(([conn, done]) => {
      log("Querying for mw_interactives")
      conn.query(getMWInteractivesInfoSql,
        (err, results) => {
          if (err) {
            die(err.toString())
          }
          writeFile(env, "lara-mwurls.json", results)

          let sql:string
          if (irsIdFilter && irsIdFilter.length > 0) {
            sql = getRunStatesWithIdsSql(irsIdFilter);
            log(`Querying for interactive_run_states with ids: ${irsIdFilter}`)
          } else {
            sql = getAllRunStatesSql;
            log("Querying for all interactive_run_states")
          }

          conn.query(sql,
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
