import { Construct } from "constructs";
import {
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_nodejs,
  aws_s3 as s3,
  aws_s3_notifications as s3n,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import * as path from "path";

export class CdkTsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "CdkTsPracticeVPC", {
      cidr: "10.0.0.0/16",
      maxAzs: 3,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 20,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 20,
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    const roleForCopy = new iam.Role(this, "CdkTsPracticeRoleForCopy", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    const roleForWrite = new iam.Role(this, "CdkTsPracticeRoleForWrite", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    const bucket = new s3.Bucket(this, "CdkTsPracticeBucket", {
      bucketName: "cdk-ts-practice-bucket",
    });
    const cloneBucket = new s3.Bucket(this, "CdkTsPracticeBucketClone", {
      bucketName: "cdk-ts-practice-bucket-clone",
    });

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:GetObject"],
        resources: [bucket.bucketArn + "/*"],
        principals: [roleForCopy],
      })
    );

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:PutObject"],
        resources: [bucket.bucketArn + "/*"],
        principals: [roleForWrite],
      })
    );

    cloneBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:PutObject"],
        resources: [cloneBucket.bucketArn + "/*"],
        principals: [roleForCopy],
      })
    );

    const putToS3 = new aws_lambda_nodejs.NodejsFunction(this, "putToS3", {
      entry: path.join(__dirname, "/../../lambda/ts/putToS3.ts"),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      depsLockFilePath: path.join(
        __dirname,
        "/../../lambda/ts/package-lock.json"
      ),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
      role: roleForWrite,
    });

    const copyfromS3ToS3 = new aws_lambda_nodejs.NodejsFunction(
      this,
      "copyfromS3ToS3",
      {
        entry: path.join(__dirname, "/../../lambda/ts/putToS3.ts"),
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "handler",
        depsLockFilePath: path.join(
          __dirname,
          "/../../lambda/ts/package-lock.json"
        ),
        environment: {
          BUCKET_NAME: cloneBucket.bucketName,
        },
        role: roleForCopy,
      }
    );

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(copyfromS3ToS3)
    );
  }
}
