#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ElsaStack } from "./elsa-stack";

const context = {
  namespace: "elsa",
};

const app = new cdk.App({ context: context });

const stackTag = {
  Stack: "Elsa",
};

new ElsaStack(app, "ElsaStack", {
  stackName: "elsa",
  tags: stackTag,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
