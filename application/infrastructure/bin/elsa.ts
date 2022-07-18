#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ElsaStack } from "../stack/elsa-stack";

const app = new cdk.App();

const props = {};

const stackTag = {
  stack: "elsa",
};

new ElsaStack(app, "ElsaStack", {
  stackName: "elsa",
  tags: stackTag,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
