import config from "./get-config"
import arg from "arg"

import die from "./die"
import laraPull from "./lara-pull"
import docStoreGetSizes from "./docstore-get-sizes"
import docStoreGetContents from "./docstore-get-contents"
import awsUpload from "./aws-upload"
import firestoreCreate from "./firestore-create"
import laraUpdate from "./lara-update"
import categorizeUrls from "./categorize-urls"
import mapDocIds from "./map-doc-ids"
import resolveLegacyUrls from "./resolve-legacy-urls"
import computeNewMWUrls from "./compute-new-mw-urls"

const args = arg({
  "--env": String,
  "--step": String
})

if (["staging", "production"].indexOf(args["--env"] || "") === -1) {
  die("--env parameter must be staging or production")
}

const env = args["--env"] as "staging" | "production"
const step = args["--step"] || ""

switch (step) {
  case "lara-pull":
    if (!config[env].lara) {
      die(`No [${env}.lara] config found`)
    }
    laraPull(env, config[env].lara);
    break

  case "docstore-get-sizes":
    if (!config[env].docStore) {
      die(`No [${env}.docStore] config found`)
    }
    docStoreGetSizes(env, config[env].docStore);
    break

  case "docstore-get-contents":
    if (!config[env].docStore) {
      die(`No [${env}.docStore] config found`)
    }
    docStoreGetContents(env, config[env].docStore);
    break

  case "map-doc-ids":
    mapDocIds(env)
    break
    
  case "aws-upload":
    if (!config[env].aws) {
      die(`No [${env}.aws] config found`)
    }
    awsUpload(env, config[env].aws);
    break
  
  case "firestore-create":
    firestoreCreate(env)
    break
  
  case "lara-update":
    if (!config[env].lara) {
      die(`No [${env}.lara] config found`)
    }
    laraUpdate(env, config[env].lara);
    break

  case "categorize-urls":
    categorizeUrls(env);
    break

  case "resolve-legacy-urls":
    resolveLegacyUrls(env);
    break

  case "compute-new-mw-urls":
    computeNewMWUrls(env)
    break

  default:
    die(`Unknown --step: ${step}`)
}
