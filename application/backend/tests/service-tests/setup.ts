import { container } from "tsyringe";
import { S3Client } from "@aws-sdk/client-s3";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import * as edgedb from "edgedb";
import { Issuer } from "openid-client";
import { exec } from "child_process";
import { promisify } from "util";
import { ElsaSettings } from "../../src/config/elsa-settings";
import { MOCK_DATASET_URI, MOCK_STORAGE_PREFIX_URL } from "./ag.common";

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

  testContainer.register<CloudFormationClient>("CloudFormationClient", {
    useFactory: () => new CloudFormationClient({}),
  });

  const { stdout: remsUserStdout, stderr: remsUserStderr } = await execPromise(
    `security find-generic-password -s "rems.botUser" -w elsa-data`
  );

  const { stdout: remsKeyStdout, stderr: remsKeyStderr } = await execPromise(
    `security find-generic-password -s "rems.botKey" -w elsa-data`
  );

  testContainer.register<ElsaSettings>("Settings", {
    useFactory: () => {
      const s: ElsaSettings = {
        port: 3000,
        superAdmins: [],
        deployedUrl: "http://localhost:3000",
        // environment: "development",
        // location: "local-mac",
        remsUrl: "https://hgpp-rems.dev.umccr.org",
        remsBotKey: remsKeyStdout.trim(),
        remsBotUser: remsUserStdout.trim(),
        oidcClientId: "",
        oidcClientSecret: "",
        oidcIssuer: new Issuer({
          issuer: "https://cilogon.org",
        }),
        sessionSalt: "ABCD",
        sessionSecret: "XYZ",
        ontoFhirUrl: "",
        awsSigningSecretAccessKey: "A",
        awsSigningAccessKeyId: "B",
        rateLimit: {},
        datasets: [
          {
            name: "Cardiac",
            description: "An Australian Genomics flagship.",
            uri: MOCK_DATASET_URI,
            storageLocation: "aws-s3",
            storageUriPrefix: MOCK_STORAGE_PREFIX_URL,
          },
        ],
      };
      return s;
    },
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
