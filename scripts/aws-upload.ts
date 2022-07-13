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

  const docStoreSizes = readJSON(env, "docstore-sizes.json")
  const recordIds: number[] = docStoreSizes.map((row: any) => row.id)

  const client = new S3Client({
    region:'us-east-1',
    credentials:{
      accessKeyId,
      secretAccessKey
    }
  });

  for await (const id of recordIds) {
    const key = `${folder}/cfm-migrate-${id}/file.json`
    const body = readDocstoreFile(env, id)

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

