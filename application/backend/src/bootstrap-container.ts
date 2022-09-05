import * as edgedb from "edgedb";
import { container } from "tsyringe";
import { S3Client } from "@aws-sdk/client-s3";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { ElsaSettings } from "./config/elsa-settings";

export function registerTypes() {
  container.register<edgedb.Client>("Database", {
    useFactory: () => edgedb.createClient(),
  });

  container.register<S3Client>("S3Client", {
    useFactory: () => new S3Client({}),
  });

  container.register<CloudFormationClient>("CloudFormationClient", {
    useFactory: () => new CloudFormationClient({}),
  });
}
