import { aws_iam, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import { aws_lambda_nodejs } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
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

    const roleForCopy = new aws_iam.Role(this, "CdkTsPracticeRoleForCopy", {
      assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    const roleForWrite = new aws_iam.Role(this, "CdkTsPracticeRoleForWrite", {
      assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    const bucket = new s3.Bucket(this, "CdkTsPracticeBucket", {
      bucketName: "cdk-ts-practice-bucket",
    });
    const cloneBucket = new s3.Bucket(this, "CdkTsPracticeBucketClone", {
      bucketName: "cdk-ts-practice-bucket-clone",
    });

    bucket.addToResourcePolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: ["s3:GetObject"],
        resources: [bucket.bucketArn + "/*"],
        principals: [roleForCopy],
      })
    );

    bucket.addToResourcePolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: ["s3:PutObject"],
        resources: [bucket.bucketArn + "/*"],
        principals: [roleForWrite],
      })
    );

    cloneBucket.addToResourcePolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: ["s3:PutObject"],
        resources: [cloneBucket.bucketArn + "/*"],
        principals: [roleForCopy],
      })
    );

    const lambda = new aws_lambda_nodejs.NodejsFunction(this, "tsPutToS3", {
      entry: path.join(__dirname, "/../../lambda/ts/putToS3.ts"),
      runtime: Runtime.NODEJS_16_X,
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

    const copyLmbda = new aws_lambda_nodejs.NodejsFunction(this, "tsCopyToS3", {
      entry: path.join(__dirname, "/../../lambda/ts/putToS3.ts"),
      runtime: Runtime.NODEJS_16_X,
      handler: "handler",
      depsLockFilePath: path.join(
        __dirname,
        "/../../lambda/ts/package-lock.json"
      ),
      environment: {
        BUCKET_NAME: cloneBucket.bucketName,
      },
      role: roleForCopy,
    });
  }
}
