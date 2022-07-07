import path from "path"
import fs from "fs"
import log from "./log";
import die from "./die";

const readJSON = (env: string, filename: string) => {
  const basePath = path.resolve(__dirname, "../data", env);
  const filePath = path.resolve(basePath, filename);
  if (!fs.existsSync(filePath)) {
    die(`Unable to find: ${filePath}`)
  }
  log(`Reading ${filePath}`)
  return JSON.parse(fs.readFileSync(filePath).toString())
}

export default readJSON