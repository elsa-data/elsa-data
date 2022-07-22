import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_ec2 as ec2,
  aws_ssm as ssm,
  aws_route53 as route53,
} from "aws-cdk-lib";
import { ElsaEdgedbStack } from "../lib/elsa-edgedb";
import { ElsaVPC } from "../lib/vpc";

export class ElsaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // const vpc = new ElsaVPC(this, `elsaVPC`);

    /**
     * Importing existing UMCCR Resource
     */
    const vpc = ec2.Vpc.fromLookup(this, "UMCCRMainVPC", {
      vpcName: "main-vpc",
    });
    const hostedZoneName = ssm.StringParameter.valueFromLookup(
      this,
      "/hosted_zone/umccr/name"
    );
    const hostedZoneId = ssm.StringParameter.valueFromLookup(
      this,
      "/hosted_zone/umccr/id"
    );

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      { hostedZoneId: hostedZoneId, zoneName: hostedZoneName }
    );

    /**
     * Creating DB and DB server
     */
    const elsaEdgedb = new ElsaEdgedbStack(this, "DatabaseStack", {
      stackName: `elsaDatabaseStack`,
      vpc: vpc,
      hostedZone: hostedZone,
      config: {
        isHighlyAvailable: false,
        rds: {
          clusterIdentifier: `elsa`,
          dbName: `elsa`,
          dsnRdsSecretManagerName: "elsa-postgres",
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
        },
      },
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });
  }
}
