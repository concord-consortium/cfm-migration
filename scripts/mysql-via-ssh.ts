import mysql from "mysql2"
import fs from "fs"
import { Client } from "ssh2"
import die from "./die";
import log from "./log";

interface ConnectOptions {
  dbHost: string;
  dbPassword: string;
  ecsHost: string;
  ecsUser: string;
  ecsKey: string;
}

export const connect = (options: ConnectOptions) => {
  const {dbHost, dbPassword, ecsHost, ecsUser, ecsKey} = options;

  if (!fs.existsSync(ecsKey)) {
    die(`Unable to read key file: ${ecsKey}`)
  }

  const sshClient = new Client();
  const dbServer = {
    host: dbHost,
    port: 3306,
    user: "master",
    password: dbPassword,
    database: "portal"
  }
  const tunnelConfig = {
    host: ecsHost,
    port: 22,
    username: ecsUser,
    privateKey: fs.readFileSync(ecsKey).toString()
  }
  const forwardConfig = {
    srcHost: '127.0.0.1',
    srcPort: 3306,
    dstHost: dbServer.host,
    dstPort: dbServer.port
  };
  return new Promise<[mysql.Pool, () => void]>((resolve, reject) => {
    log("Initializing ssh client")
    sshClient.on('ready', () => {
      sshClient.forwardOut(
        forwardConfig.srcHost,
        forwardConfig.srcPort,
        forwardConfig.dstHost,
        forwardConfig.dstPort,
        (err, stream) => {
          if (err) reject(err);
          const updatedDbServer = {
            ...dbServer,
            stream
          };
          log("Creating mysql pool using", JSON.stringify(dbServer, null, 2))
          const pool =  mysql.createPool(updatedDbServer);
          resolve([pool, () => {
            log("Closing mysql pool and ssh client")
            pool.end();
            sshClient.end();
          }]);
          /*
          pool.connect((error) => {
            if (error) {
              reject(error);
            }
            log("Connected to mysql server")
            resolve([pool, () => {
              pool.end();
              sshClient.end();
            }]);
          });
          */
        });
      }).connect(tunnelConfig);
  });
}
