import die from "./die";
import { readDocstoreFile } from "./docstore-file";
import { AWSConfig } from "./get-config";
import log from "./log";
import readJSON from "./read-json";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const awsUpload = async (env: string, awsConfig: AWSConfig) => {
  const {bucket, folder, accessKeyId, secretAccessKey} = awsConfig

  if (!folder || folder.trim().length == 0) {
    die("MISSING FOLDER!")
  }

  const laraIdsIdsToDocIds = readJSON(env, "lara-irs-to-doc-ids")
  const laraIrsIds = Object.keys(laraIdsIdsToDocIds)

  const client = new S3Client({
    region:'us-east-1',
    credentials:{
      accessKeyId,
      secretAccessKey
    }
  });

  for await (const laraIrsId of laraIrsIds) {
    const recordid = laraIdsIdsToDocIds[laraIrsId]
    const key = `${folder}/cfm-migrate-${laraIrsId}-${recordid}/file.json`
    const body = readDocstoreFile(env, recordid)

    log(`Uploading ${key}`)

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'application/json',
      ContentEncoding: 'UTF-8',
      CacheControl: 'no-cache'
    });
    try {
      await client.send(command);
    } catch (e) {
      console.error("Failed to upload", key, e)
    }
  }
};

export default awsUpload;

