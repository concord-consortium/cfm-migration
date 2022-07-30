import { extractRecordId } from "./extract-record-id";
import readJSON from "./read-json";
import writeFile from "./write-file";
import https from "https";

const resolveFinalUrl = (recordid: string) => {
  return new Promise<string>((resolve, reject) => {
    const url = `https://models-resources.concord.org/legacy-document-store/${recordid}`
    console.log("LOOKING UP", url)
    https.request(url, { method: 'HEAD' }, (res) => {
      if (res.headers.location && res.headers.location.match(/\/cfm-shared\//)) {
        resolve(`https://models-resources.concord.org${res.headers.location}`);
      } else {
        reject(`${url}: INVALID REDIRECT: ${res.headers.location}`)
      }
    }).on('error', (err) => {
      reject(err)
    }).end();
  })
}

const wait = () => new Promise(resolve => setTimeout(resolve, 10))

const resolveLegacyUrls = async (env: string) => {
  const mwUrlsJson = readJSON(env, "lara-mwurls.json")

  const lookupRecordids: Record<string, string> = {}

  for await (const row of mwUrlsJson) {
    row.resolvedUrl = null

    const recordid = extractRecordId(row.mwUrl)
    if (recordid) {
      if (recordid.match(/https:\/\/cfm-shared\.concord\.org\/([^/]+)\/file.json/)) {
        // nothing to do here
        row.resolvedUrl = recordid
      } else {
        let parsedRecordid: string|null = null
        const m = recordid.match(/https:\/\/models-resources\.concord\.org\/legacy-document-store\/(\d+)/)
        if (m) {
          parsedRecordid = m[1]
        }
        else if (!isNaN(parseInt(recordid))) {
          parsedRecordid = recordid
        }
        else {
          console.log(recordid)
        }

        if (parsedRecordid) {
          if (!lookupRecordids[parsedRecordid]) {
            try {
              lookupRecordids[parsedRecordid] = row.resolvedUrl = await resolveFinalUrl(parsedRecordid)
            } catch (err) {
              console.log(err)
            }
            await wait()
          } else {
            row.resolvedUrl = lookupRecordids[parsedRecordid]
          }
        }
      }
    } else {
      // console.error("NOT FOUND", row)
    }
  }

  writeFile(env, "resolved-lara-mwurls.json", mwUrlsJson)
}

export default resolveLegacyUrls;