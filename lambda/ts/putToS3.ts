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
  const client = new S3Client({});
  const params: PutObjectCommandInput = {
    Bucket: process.env.BUCKET_NAME,
    Key: "test.txt",
    Body: JSON.stringify(event),
  };
  const putCommand = new PutObjectCommand(params);
  try {
    await client.send(putCommand);
  } catch (err) {
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
