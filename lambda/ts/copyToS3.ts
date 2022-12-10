import AWS from "aws-sdk";
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";

AWS.config.update({ region: "ap-northeast-1" });
AWS.config.apiVersions = {
  s3: "2006-03-01",
};

export const handler = async (event: any) => {
  const filename =
    event.Records[0].s3.object.key + event.Records[0].eventTime + ".json";

  const client = new S3Client({});
  const paramsFroWrite: PutObjectCommandInput = {
    Bucket: process.env.DIST_BUCKET_NAME,
    Key: filename,
    Body: JSON.stringify(event),
  };
  const putCommand = new PutObjectCommand(paramsFroWrite);
  await client.send(putCommand);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: {},
    }),
  };
};
