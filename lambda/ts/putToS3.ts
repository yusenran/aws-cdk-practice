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
    Bucket: "cdk-ts-practice-bucket",
    Key: "test.txt",
    Body: "Hello World!",
  };
  const putCommand = new PutObjectCommand(params);
  await client.send(putCommand);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello World!",
    }),
  };
};
