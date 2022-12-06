import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_route53 as route53,
  CfnOutput,
  Duration,
  NestedStack,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import * as path from "path";
import { DockerImageAsset, Platform } from "aws-cdk-lib/aws-ecr-assets";
import { DockerServiceWithHttpsLoadBalancerConstruct } from "../lib/docker-service-with-https-load-balancer-construct";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";

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

    const tempBucket = new Bucket(this, "TempBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      encryption: BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: Duration.days(1),
          expiration: Duration.days(1),
        },
      ],
    });

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
          logStreamPrefix: "elsa",
          healthCheckPath: "/",
          environment: {
            EDGEDB_DSN: config.edgeDbDsnNoPassword,
            ELSA_DATA_META_CONFIG_FOLDERS: "./config",
            ELSA_DATA_META_CONFIG_SOURCES:
              "file('base') file('dev-common') file('dev-deployed') file('datasets') aws-secret('ElsaDataDevDeployed')",
            // override any file based setting of the deployed url
            ELSA_DATA_CONFIG_DEPLOYED_URL: `https://${hostedPrefix}.${hostedZoneName}`,
            ELSA_DATA_CONFIG_PORT: "80",
            ELSA_DATA_CONFIG_AWS_TEMP_BUCKET: tempBucket.bucketName,
          },
          secrets: {
            EDGEDB_PASSWORD: ecs.Secret.fromSecretsManager(
              config.edgeDbPasswordSecret
            ),
          },
        }
      );

    // 👇 grant access to bucket
    tempBucket.grantReadWrite(
      privateServiceWithLoadBalancer.service.taskDefinition.taskRole
    );

    // the permissions of the running container (i.e all AWS functionality used by Elsa Data code)
    privateServiceWithLoadBalancer.service.taskDefinition.taskRole.attachInlinePolicy(
      new Policy(this, "FargateServiceTaskPolicy", {
        statements: [
          // need to be able to fetch secrets - we wildcard to everything with our designated prefix
          new PolicyStatement({
            actions: ["secretsmanager:GetSecretValue"],
            resources: [
              `arn:aws:secretsmanager:${Stack.of(this).region}:${
                Stack.of(this).account
              }:secret:ElsaData*`,
            ],
          }),
          // temporarily give all S3 accesspoint perms - can we tighten?
          new PolicyStatement({
            actions: [
              "s3:CreateAccessPoint",
              "s3:DeleteAccessPoint",
              "s3:GetAccessPoint",
              "s3:GetAccessPointPolicy",
              "s3:ListAccessPoints",
            ],
            resources: [`*`],
          }),
          // need to be able to invoke lambdas
          new PolicyStatement({
            actions: ["lambda:InvokeFunction"],
            resources: [
              `arn:aws:lambda:${Stack.of(this).region}:${
                Stack.of(this).account
              }:function:elsa-data-*`,
            ],
          }),
          // access points need the ability to do CloudFormation
          // TODO: tighten the policy on the CreateStack as that is a powerful function
          //     possibly restrict the source of the template url
          //     possibly restrict the user enacting the CreateStack to only them to create access points
          new PolicyStatement({
            actions: [
              "cloudformation:CreateStack",
              "cloudformation:DescribeStacks",
              "cloudformation:DeleteStack",
            ],
            resources: [
              `arn:aws:cloudformation:${Stack.of(this).region}:${
                Stack.of(this).account
              }:stack/elsa-data-*`,
            ],
          }),
        ],
      })
    );

    new CfnOutput(this, "ElsaDeployUrl", {
      value: `https://${hostedPrefix}.${hostedZoneName}`,
    });
  }
}
