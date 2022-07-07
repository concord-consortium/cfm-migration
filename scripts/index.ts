import config from "./get-config"
import arg from "arg"

import die from "./die"
import laraPull from "./lara-pull"
import docStoreGetSizes from "./docstore-get-sizes"
import docStoreGetContents from "./docstore-get-contents"

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
  
  default:
    die(`Unknown --step: ${step}`)
}
