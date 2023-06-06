import { DependencyContainer } from "tsyringe";
import { S3Client } from "@aws-sdk/client-s3";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import { SES } from "@aws-sdk/client-ses";
import { ServiceDiscoveryClient } from "@aws-sdk/client-servicediscovery";
import { SFNClient } from "@aws-sdk/client-sfn";
import { STSClient } from "@aws-sdk/client-sts";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

/**
 * Register factories for all the AWS clients we might need.
 *
 * This helps consolidate the constructor to one spot in case we need to inject settings.
 */
export function bootstrapDependencyInjectionAwsClients(
  dc: DependencyContainer
) {
  // whilst it is possible to create these AWS clients close to where they are needed - it then becomes
  // hard to manage any global configuration (not that we have any global config though yet!)
  // so anyhow - the preferred mechanism for sourcing a AWS service client is by registering
  // it here and DI it

  // the assumption here is that AWS_REGION is set by our environment and hence does not need to be
  // provided here
  // in all deployed AWS this is true
  // for local dev we should set AWS_REGION explicitly when setting shell credentials (aws-vault etc)
  const awsClientConfig = {};

  dc.register<S3Client>("S3Client", {
    useFactory: () => new S3Client(awsClientConfig),
  });

  dc.register<CloudTrailClient>("CloudTrailClient", {
    useFactory: () => new CloudTrailClient(awsClientConfig),
  });

  dc.register<CloudFormationClient>("CloudFormationClient", {
    useFactory: () => new CloudFormationClient(awsClientConfig),
  });

  dc.register<SES>("SESClient", {
    useFactory: () => new SES(awsClientConfig),
  });

  dc.register<ServiceDiscoveryClient>("ServiceDiscoveryClient", {
    useFactory: () => new ServiceDiscoveryClient(awsClientConfig),
  });

  dc.register<SecretsManagerClient>("SecretsManagerClient", {
    useFactory: () => new SecretsManagerClient(awsClientConfig),
  });

  dc.register<SFNClient>("SFNClient", {
    useFactory: () => new SFNClient(awsClientConfig),
  });

  dc.register<STSClient>("STSClient", {
    useFactory: () => new STSClient(awsClientConfig),
  });
}
