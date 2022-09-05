import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_ec2 as ec2,
  aws_ssm as ssm,
  aws_route53 as route53,
} from "aws-cdk-lib";
import { EdgeDbStack } from "./stack/edge-db";
import { smartVpcConstruct } from "./lib/vpc";
import { ElsaApplicationStack } from "./stack/elsa-application";

export class ElsaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * Importing existing UMCCR Resource
     */
    const vpc = smartVpcConstruct(this, "VPC", "main-vpc");
    const hostedZoneName = ssm.StringParameter.valueFromLookup(
      this,
      "/hosted_zone/umccr/name",
    );
    const hostedZoneId = ssm.StringParameter.valueFromLookup(
      this,
      "/hosted_zone/umccr/id",
    );

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      { hostedZoneId: hostedZoneId, zoneName: hostedZoneName },
    );

    /**
     * Creating DB and DB server
     */
    const edgeDb = new EdgeDbStack(this, "DatabaseStack", {
      stackName: `elsaDatabaseStack`,
      vpc: vpc,
      hostedZone: hostedZone,
      config: {
        isHighlyAvailable: false,
        rds: {
          clusterIdentifier: `elsa`,
          dbName: `elsa`,
        },
        ecs: {
          serviceName: "elsa",
          clusterName: "elsa",
          cpu: 1024,
          memory: 2048,
          port: 5656,
        },
        edgedb: {
          dbName: "elsa",
          user: "elsa",
          port: "5656",
          customDomain: `db.elsa.${hostedZone.zoneName}`,
          serverCredentialSecretManagerName: "elsa/edgedb/credentials", // pragma: allowlist secret
          tlsKeySecretManagerName: "elsa/tls/key", // pragma: allowlist secret
          tlsCertSecretManagerName: "elsa/tls/cert", // pragma: allowlist secret
        },
      },
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });

    const elsa = new ElsaApplicationStack(this, "Elsa", {
      vpc: vpc,
      hostedZone: hostedZone,
      config: {
        edgeDbUrl: edgeDb.edgeDbUrl,
      },
    });
  }
}
