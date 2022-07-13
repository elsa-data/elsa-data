#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { S3CloudTrailLakeStack } from "../lib/s3-cloud-trail-lake-stack";

const props = {
  bucketArn: "arn:aws:s3:::example/store/",
};

const stackTags = {
  creator: "s3CloudTrailStack",
};
const app = new cdk.App();
new S3CloudTrailLakeStack(app, "S3CloudTrailLakeStack", {
  tags: stackTags,
  bucketArn: props.bucketArn,
});
