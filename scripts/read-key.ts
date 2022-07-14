import path from "path"
import fs from "fs"
import log from "./log";
import die from "./die";

const readKey = (env: string, filename: string) => {
  const basePath = path.resolve(__dirname, "../keys");
  const filePath = path.resolve(basePath, `${filename}-${env}.json`);
  if (!fs.existsSync(filePath)) {
    die(`Unable to find: ${filePath}`)
  }
  log(`Reading ${filePath}`)
  return JSON.parse(fs.readFileSync(filePath).toString())
}

export default readKey