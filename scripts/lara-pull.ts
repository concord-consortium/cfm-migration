import die from "./die";
import { LaraConfig } from "./get-config";
import log from "./log";
import { connect } from "./mysql-via-ssh";
import writeFile from "./write-file";

//  or mw.url like '%https://codap.concord.org/app/static%'
const fromCommonMWInteractivesSql = `
  from mw_interactives mw
  left join page_items pi on (pi.embeddable_type = 'MwInteractive' and pi.embeddable_id = mw.id)
  left join interactive_pages ip on pi.interactive_page_id = ip.id 
  left join lightweight_activities la on ip.lightweight_activity_id = la.id
  left join lightweight_activities_sequences la_seq on la_seq.lightweight_activity_id = la.id
  left join sequences seq on seq.id = la_seq.sequence_id
  where (mw.url like '%document-store.concord.org%' or mw.url like '%cloud-file-manager.concord.org%')
`
const getMWInteractivesInfoSql = `
  select seq.id as sequenceId, seq.title as sequenceTitle, la.id as activityId, la.name as activityName, mw.id as mwId, mw.url as mwUrl,
  mw.aspect_ratio_method as aspectRatioMethod, mw.native_width as nativeWidth, mw.native_height as nativeHeight ${fromCommonMWInteractivesSql}
`

const getAllRunStatesSql = `
  select irs.id, irs.interactive_id, irs.raw_data, irs.metadata, r.key as run_key, u.email, r.context_id, r.platform_id, r.platform_user_id, irs.created_at, irs.updated_at
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
