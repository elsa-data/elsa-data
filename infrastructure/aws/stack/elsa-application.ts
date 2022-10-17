import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_route53 as route53,
  CfnOutput,
  NestedStack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import path from "path";
import { DockerImageAsset, Platform } from "aws-cdk-lib/aws-ecr-assets";
import { DockerServiceWithHttpsLoadBalancerConstruct } from "../lib/docker-service-with-https-load-balancer-construct";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";

interface Props extends StackProps {
  vpc: ec2.IVpc;
  hostedZone: route53.IHostedZone;
  config: {
    edgeDbDsnNoPassword: string;
    edgeDbPasswordSecret: ISecret;
  };
}

/**
 * The stack for deploying the actual Elsa website application.
 */
export class ElsaApplicationStack extends NestedStack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const config = props.config;

    const hostedPrefix = "elsa";

    const hostedZoneName = StringParameter.valueFromLookup(
      this,
      "hosted_zone_name"
    );
    const certApse2Arn = StringParameter.valueFromLookup(
      this,
      "cert_apse2_arn"
    );

    const dockerImageFolder = path.join(__dirname, "../../../application");

    const asset = new DockerImageAsset(this, "ElsaDockerImage", {
      directory: dockerImageFolder,
      platform: Platform.LINUX_ARM64,
      buildArgs: {},
    });

    const privateServiceWithLoadBalancer =
      new DockerServiceWithHttpsLoadBalancerConstruct(
        this,
        "PrivateServiceWithLb",
        {
          vpc: props.vpc,
          hostedPrefix: hostedPrefix,
          hostedZoneName: hostedZoneName,
          hostedZoneCertArn: certApse2Arn,
          imageAsset: asset,
          memoryLimitMiB: 2048,
          cpu: 1024,
          desiredCount: 1,
          containerName: "elsa",
          healthCheckPath: "/",
          environment: {
            EDGEDB_DSN: config.edgeDbDsnNoPassword,
          },
          secrets: {
            EDGEDB_PASSWORD: ecs.Secret.fromSecretsManager(
              config.edgeDbPasswordSecret
            ),
          },
        }
      );

    // the running container gets its settings from a secret (independant of the secrets used to actually
    // spin up the container)
    privateServiceWithLoadBalancer.service.taskDefinition.taskRole.attachInlinePolicy(
      new Policy(this, "FargateServiceTaskPolicy", {
        statements: [
          new PolicyStatement({
            actions: ["secretsmanager:GetSecretValue"],
            resources: ["arn:aws:secretsmanager:*:*:secret:Elsa-??????"],
          }),
        ],
      })
    );

    new CfnOutput(this, "ElsaDeployUrl", {
      value: `https://${hostedPrefix}.${hostedZoneName}`,
    });
  }
}
