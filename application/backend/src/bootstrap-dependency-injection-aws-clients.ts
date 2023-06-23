import { DependencyContainer } from "tsyringe";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import { SESClient } from "@aws-sdk/client-ses";
import { ServiceDiscoveryClient } from "@aws-sdk/client-servicediscovery";
import { SFNClient } from "@aws-sdk/client-sfn";
import { STSClient } from "@aws-sdk/client-sts";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { createMockServiceDiscovery } from "./test-data/aws-mock/service-discovery";
import { createMockSecretsManager } from "./test-data/aws-mock/secrets-manager";
import { mockClient } from "aws-sdk-client-mock";
import { addMocksForFileSystem } from "./test-data/aws-mock/add-s3-mocks-for-filesystem";
import {
  SMARTIE_FAKE_BUCKET,
  SMARTIE_FAKE_KEY,
} from "./test-data/dataset/insert-test-data-smartie";
import { join } from "node:path";
import { addMocksForInMemory } from "./test-data/aws-mock/add-s3-mocks-for-in-memory";
import { australianGenomicsDirectoryStructureFor10G } from "./test-data/dataset/insert-test-data-10g";
import { createMockSteps } from "./test-data/aws-mock/steps";
import { createMockCloudTrail } from "./test-data/aws-mock/cloud-trail";
import { createMockSts } from "./test-data/aws-mock/sts";
import { createMockSes } from "./test-data/aws-mock/ses";
import { createMockCloudFormation } from "./test-data/aws-mock/cloud-formation";

/**
 * Register factories for all the AWS clients we might need.
 *
 * This helps consolidate the constructor to one spot in case we need to inject settings.
 */
export async function bootstrapDependencyInjectionAwsClients(
  dc: DependencyContainer,
  mockAws: boolean
) {
  if (mockAws) {
    const s3MockClient = mockClient(S3Client);

    // s3MockClient.onAnyCommand().rejects("All calls to S3 need to be mocked");

    // this will fail if the datasets folder is not present - which means basically anything that
    // is not local dev source... so don't set mockAws if in any other environment!
    await addMocksForFileSystem(
      s3MockClient,
      SMARTIE_FAKE_BUCKET,
      SMARTIE_FAKE_KEY,
      join(__dirname, "..", "datasets", "Smartie")
    );

    const tengPhases = await australianGenomicsDirectoryStructureFor10G();

    // we want the entire dataset - which means we can install the second phase
    // (phase 1 is partial data if we want to experiment with dataset updates)
    await addMocksForInMemory(
      s3MockClient,
      "agha-gdr-demo-store",
      "10G",
      tengPhases[1]
    );

    // our access point work requires us to save the CloudFormation template into our temp bucket..
    // so we add this (WIP - this will clash with anything else that uses temp bucket)
    s3MockClient.on(PutObjectCommand).resolves({});

    const cloudFormationClient = createMockCloudFormation();
    const cloudTrailClient = createMockCloudTrail();
    const secretsManagerClient = createMockSecretsManager();
    const serviceDiscoverClient = createMockServiceDiscovery();
    const sesClient = createMockSes();
    const sfnClient = createMockSteps();
    const stsClient = createMockSts();

    dc.register("CloudFormationClient", { useValue: cloudFormationClient });
    dc.register("CloudTrailClient", { useValue: cloudTrailClient });
    dc.register("S3Client", { useValue: s3MockClient });
    dc.register("SecretsManagerClient", { useValue: secretsManagerClient });
    dc.register("ServiceDiscoveryClient", { useValue: serviceDiscoverClient });
    dc.register("SESClient", { useValue: sesClient });
    dc.register("SFNClient", { useValue: sfnClient });
    dc.register("STSClient", { useValue: stsClient });
  } else {
    // the assumption here is that AWS_REGION is set by our environment and hence does not need to be
    // provided here
    // in all deployed AWS this is true
    // for local dev we should set AWS_REGION explicitly when setting shell credentials (aws-vault etc)
    const awsClientConfig = {};

    dc.register<CloudFormationClient>("CloudFormationClient", {
      useFactory: () => new CloudFormationClient(awsClientConfig),
    });
    dc.register<CloudTrailClient>("CloudTrailClient", {
      useFactory: () => new CloudTrailClient(awsClientConfig),
    });
    dc.register<S3Client>("S3Client", {
      useFactory: () => new S3Client(awsClientConfig),
    });
    dc.register("SecretsManagerClient", {
      useFactory: () => new SecretsManagerClient(awsClientConfig),
    });
    dc.register("ServiceDiscoveryClient", {
      useFactory: () => new ServiceDiscoveryClient(awsClientConfig),
    });
    dc.register<SESClient>("SESClient", {
      useFactory: () => new SESClient(awsClientConfig),
    });
    dc.register<SFNClient>("SFNClient", {
      useFactory: () => new SFNClient(awsClientConfig),
    });
    dc.register<STSClient>("STSClient", {
      useFactory: () => new STSClient(awsClientConfig),
    });
  }
}
