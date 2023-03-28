import path from "path"
import fs from "fs"
import mkdirp from "mkdirp"
import log from "./log";

const fileExists = (env: string, filename: string) => {
  const basePath = path.resolve(__dirname, "../data", env);
  mkdirp.sync(basePath)
  const filePath = path.resolve(basePath, filename);
  log(`Checking if ${filePath} exists`)
  return fs.existsSync(filePath)
}

export default fileExists