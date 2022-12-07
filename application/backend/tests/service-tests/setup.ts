import { container } from "tsyringe";
import { S3Client } from "@aws-sdk/client-s3";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import * as edgedb from "edgedb";
import { exec } from "child_process";
import { promisify } from "util";
import { ElsaSettings } from "../../src/config/elsa-settings";
import { createTestElsaSettings } from "../test-elsa-settings.common";

const execPromise = promisify(exec);
export async function registerTypes() {
  // TO USE CHILD CONTAINERS WE'D NEED TO TEACH FASTIFY TO DO THE SAME..
  const testContainer = container; //.createChildContainer();

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

  /*testContainer.beforeResolution(
    "Database",
    // Callback signature is (token: InjectionToken<T>, resolutionType: ResolutionType) => void
    () => {
      console.log("Database is about to be resolved!");
    },
    { frequency: "Always" }
  ); */

  return testContainer;
}
