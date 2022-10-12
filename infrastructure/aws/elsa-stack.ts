import { aws_ecs as ecs, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_ec2 as ec2,
  aws_ssm as ssm,
  aws_route53 as route53,
} from "aws-cdk-lib";
import { EdgeDbStack } from "./stack/edge-db";
import { smartVpcConstruct } from "./lib/vpc";
import { ElsaApplicationStack } from "./stack/elsa-application";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

export class ElsaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * Importing existing UMCCR Resource
     */
    const vpc = smartVpcConstruct(this, "VPC", "main-vpc");
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

    // TODO: clean this up - ideally we would have all the certs in the master Elsa settings secrets
    // const elsaSecret = Secret.fromSecretNameV2(this, "ElsaSecret", "Elsa");

    const edgeDbCa = Secret.fromSecretNameV2(
      this,
      "CaSecret",
      "elsa/tls/rootCA"
    );
    const edgeDbKey = Secret.fromSecretNameV2(
      this,
      "KeySecret",
      "elsa/tls/key"
    );
    const edgeDbCert = Secret.fromSecretNameV2(
      this,
      "CertSecret",
      "elsa/tls/cert"
    );

    const elsaEdgeDbCert = ecs.Secret.fromSecretsManager(edgeDbCert);
    const elsaEdgeDbKey = ecs.Secret.fromSecretsManager(edgeDbKey); // ecs.Secret.fromSecretsManager(elsaSecret, "edgeDb.tlsKey");

    /**
     * Creating DB and DB server
     */
    const edgeDb = new EdgeDbStack(this, "DatabaseStack", {
      stackName: `elsaDatabaseStack`,
      vpc: vpc,
      hostedZone: hostedZone,
      config: {
        isDevelopment: true,
        baseDatabase: {
          dbAdminUser: `elsa_admin`,
          dbName: `elsa_database`,
        },
        edgeDbService: {
          superUser: "elsa_superuser",
          desiredCount: 1,
          cpu: 1024,
          memory: 2048,
          cert: elsaEdgeDbCert,
          key: elsaEdgeDbKey,
        },
        edgeDbLoadBalancer: {
          port: 4000,
          uiPort: 4001,
        },
      },
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });

    console.log(edgeDb.dsnForEnvironmentVariable);

    const elsa = new ElsaApplicationStack(this, "Elsa", {
      vpc: vpc,
      hostedZone: hostedZone,
      config: {
        edgeDbDsnNoPassword: edgeDb.dsnForEnvironmentVariable,
        edgeDbPasswordSecret: edgeDb.edgeDbPasswordSecret,
      },
    });
  }
}
