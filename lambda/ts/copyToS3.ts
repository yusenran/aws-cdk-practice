import AWS from "aws-sdk";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
} from "@aws-sdk/client-s3";
import { Readable } from "readable-stream";

AWS.config.update({ region: "ap-northeast-1" });
AWS.config.apiVersions = {
  s3: "2006-03-01",
};

const streamToString = (stream: Readable) => {
  const chunks: Uint8Array[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
};

export const handler = async (event: any) => {
  const eventTime = event.Records[0].eventTime;
  const filename = event.Records[0].s3.object.key;

  const client = new S3Client({});
  const paramsForRead: GetObjectCommandInput = {
    Bucket: process.env.SRC_BUCKET_NAME,
    Key: filename,
  };
  const getCommand = new GetObjectCommand(paramsForRead);
  try {
    const res = await client.send(getCommand);
    const body = res.Body as Readable;
    const bodyString = await streamToString(body);

    const paramsForWrite: PutObjectCommandInput = {
      Bucket: process.env.DIST_BUCKET_NAME,
      Key: eventTime + "_" + filename,
      Body: JSON.stringify({
        name: filename,
        contents: bodyString,
      }),
    };
    const putCommand = new PutObjectCommand(paramsForWrite);
    await client.send(putCommand);
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err,
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: {},
    }),
  };
};
