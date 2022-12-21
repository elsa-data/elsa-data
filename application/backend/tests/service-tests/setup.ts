import { container } from "tsyringe";
import { S3Client } from "@aws-sdk/client-s3";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import * as edgedb from "edgedb";
import { ElsaSettings } from "../../src/config/elsa-settings";
import { createTestElsaSettings } from "../test-elsa-settings.common";
import { Logger, pino } from "pino";

export async function registerTypes() {
  // TO *REALLY* USE CHILD CONTAINERS WE'D NEED TO TEACH FASTIFY TO DO THE SAME SO FOR THE MOMENT
  // WE RETURN A CONTAINER IN ANTICIPATION OF ONE DAY DOING THAT

  const testContainer = container; //.createChildContainer();

  // we want an independant setup each call to this in testing (unlike in real code)
  testContainer.reset();

  testContainer.register<edgedb.Client>("Database", {
    useFactory: () => edgedb.createClient(),
  });

  testContainer.register<S3Client>("S3Client", {
    useFactory: () => new S3Client({}),
  });

  testContainer.register<CloudTrailClient>("CloudTrailClient", {
    useFactory: () => new CloudTrailClient({}),
  });

  testContainer.register<CloudFormationClient>("CloudFormationClient", {
    useFactory: () => new CloudFormationClient({}),
  });

  testContainer.register<ElsaSettings>("Settings", {
    useFactory: createTestElsaSettings,
  });

  testContainer.register<Logger>("Logger", {
    useValue: pino(createTestElsaSettings().logger),
  });

  return testContainer;
}
