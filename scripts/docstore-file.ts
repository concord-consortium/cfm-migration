import path from "path"
import fs from "fs"
import mkdirp from "mkdirp"
import log from "./log";

const writeDocstoreFile = (env: string, id: number, contents: any) => {
  const filePath = path.resolve(__dirname, "../data", env, "docstore", idToSubpath(id));
  mkdirp.sync(path.dirname(filePath))
  log(`Writing ${filePath}`)
  fs.writeFileSync(filePath, JSON.stringify(contents, null, 2))
}

const idToSubpath = (id: number) => {
  const padded = String(id).padStart(6, "0")
  console.log(padded)
  const [a, b, c, ...rest] = padded.split("")
  return path.join(a, b, c, rest.join("")) + ".json"
}

export default writeDocstoreFile