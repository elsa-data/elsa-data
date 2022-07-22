import { container } from "tsyringe";
import { S3Client } from "@aws-sdk/client-s3";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import * as edgedb from "edgedb";

export function registerTypes() {
  // TO USE CHILD CONTAINERS WE'D NEED TO TEACH FASTIFY TO DO THE SAME..
  const testContainer = container; //.createChildContainer();

  testContainer.register<edgedb.Client>("Database", {
    useFactory: () => edgedb.createClient(),
  });

  testContainer.register<S3Client>("S3Client", {
    useFactory: () => new S3Client({}),
  });

  testContainer.register<CloudFormationClient>("CloudFormationClient", {
    useFactory: () => new CloudFormationClient({}),
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
