import path from "path"
import fs from "fs"
import mkdirp from "mkdirp"
import log from "./log";

export const writeDocstoreFile = (env: string, id: number, contents: any) => {
  const filePath = path.resolve(__dirname, "../data", env, "docstore", idToSubpath(id));
  mkdirp.sync(path.dirname(filePath))
  log(`Writing ${filePath}`)
  fs.writeFileSync(filePath, JSON.stringify(contents))
}

export const readDocstoreFile = (env: string, id: number|string) => {
  const filePath = path.resolve(__dirname, "../data", env, "docstore", idToSubpath(id));
  log(`Reading ${filePath}`)
  return fs.readFileSync(filePath).toString()
}

const idToSubpath = (id: number|string) => {
  const padded = String(id).padStart(6, "0")
  console.log(padded)
  const [a, b, c, ...rest] = padded.split("")
  return path.join(a, b, c, rest.join("")) + ".json"
}
