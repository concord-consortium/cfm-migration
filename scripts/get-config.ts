import ini from "ini"
import fs from "fs"

import die from "./die"

interface MySqlConfig {
  ecsHost: string
  ecsUser: string
  ecsKey: string
  dbHost: string
  dbPassword: string
}

export interface LaraConfig extends MySqlConfig {
  irsIdFilter?: string
}

export interface DocStoreConfig {
  dbHost: string
  dbPassword: string
  dbDatabase: string
  dbUser: string
}

export interface AWSConfig {
  bucket: string
  folder: string
  accessKeyId: string
  secretAccessKey: string
}

export interface EnvConfig {
  lara: LaraConfig
  docStore: DocStoreConfig
  aws: AWSConfig
}

export interface Config {
  staging: EnvConfig
  production: EnvConfig
}

let config: Config = {} as any
try {
  const configContents = fs.readFileSync("./config.ini", "utf-8");
  config = ini.parse(configContents) as Config
} catch (e: any) {
  die(`Unable to read config.ini: ${e.toString()}`)
}

export default config