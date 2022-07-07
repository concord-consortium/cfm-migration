import path from "path"
import fs from "fs"
import mkdirp from "mkdirp"
import log from "./log";

const writeFile = (env: string, filename: string, contents: any) => {
  const basePath = path.resolve(__dirname, "../data", env);
  mkdirp.sync(basePath)
  const filePath = path.resolve(basePath, filename);
  log(`Writing ${filePath}`)
  fs.writeFileSync(filePath, JSON.stringify(contents, null, 2))
}

export default writeFile