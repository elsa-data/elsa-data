import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_elasticloadbalancingv2 as elbv2,
  aws_iam as iam,
  aws_logs as logs,
  aws_route53 as route53,
  aws_secretsmanager as secretsmanager,
  CfnOutput,
  Duration,
  NestedStack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CpuArchitecture,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
  OperatingSystemFamily,
} from "aws-cdk-lib/aws-ecs";
import { ServerlessBaseDatabase } from "../lib/rds/serverless-base-database";
import { NetworkLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import {
  INetworkTargetGroup,
  Protocol,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";

interface Props {
  isDevelopment?: boolean;

  // the VPC that the service will live in
  vpc: ec2.IVpc;

  // the DSN of the postgres db it will use for its store (must include base db user/pw)
  baseDbDsn: string;

  // the settings for containers of the service
  desiredCount: number;
  cpu: number;
  memory: number;

  // the edge db superuser name
  superUser: string;

  // the secret holding the edge db superuser password
  superUserSecret: ISecret;

  // edge db version string for the docker image used for edge db e.g. "2.3"
  edgeDbVersion: string;
}

/**
 * The EdgeDb service is a Fargate task cluster running the EdgeDb
 * Docker image and pointing to an external Postgres database.
 *
 * The service is set up to use self-signed certs in anticipation that
 * a network load balancer will sit in front of it.
 */
export class EdgeDbServiceConstruct extends Construct {
  // the fargate service is predicated on using the default edgedb port
  // so if you want to change this then you'll have to add some extra PORT settings in various places
  private readonly EDGE_DB_PORT = 5656;

  private readonly _service: FargateService;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc: props.vpc,
    });

    const executionRole = new iam.Role(this, "ExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSTaskExecutionRolePolicy"
        ),
      ],
    });

    const clusterLogGroup = new logs.LogGroup(this, "ServiceLog", {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // we do the task definition by hand as we have some specialised settings (ARM64 etc)
    const taskDefinition = new FargateTaskDefinition(this, "TaskDefinition", {
      runtimePlatform: {
        operatingSystemFamily: OperatingSystemFamily.LINUX,
        cpuArchitecture: CpuArchitecture.ARM64,
      },
      memoryLimitMiB: props.memory,
      cpu: props.cpu,
      executionRole: executionRole,
      // taskRole: taskImageOptions.taskRole,
      family: "edge-db-service-family",
    });

    const containerName = "edge-db";

    const env: { [k: string]: string } = {
      // because we can put a TLS terminated network load balancer in front of this - we can
      // use a self-signed cert as the internal target TLS
      // NLBs are comfortable using self-signed certs purely for traffic encryption
      // https://kevin.burke.dev/kevin/aws-alb-validation-tls-reply/
      // that way we can avoid needing to manage custom certs/cas
      EDGEDB_SERVER_TLS_CERT_MODE: "generate_self_signed",
      // the DSN (including postgres user/pw) pointing to the base database
      EDGEDB_SERVER_BACKEND_DSN: props.baseDbDsn,
      // we allow the superuser name to be set
      EDGEDB_SERVER_USER: props.superUser,
    };

    const secrets: { [k: string]: ecs.Secret } = {
      // by default cdk will grant read access in ecsExecutionRole to read the Secret Manager
      EDGEDB_SERVER_PASSWORD: ecs.Secret.fromSecretsManager(
        props.superUserSecret
      ),
    };

    if (props.isDevelopment) env.EDGEDB_SERVER_ADMIN_UI = "enabled";

    const container = taskDefinition.addContainer(containerName, {
      // https://hub.docker.com/r/edgedb/edgedb/tags
      image: ecs.ContainerImage.fromRegistry(
        `edgedb/edgedb:${props.edgeDbVersion}`
      ),
      environment: env,
      secrets: secrets,
      logging: LogDrivers.awsLogs({
        streamPrefix: "edge-db",
        logGroup: clusterLogGroup,
      }),
    });

    container.addPortMappings({
      containerPort: this.EDGE_DB_PORT,
    });

    this._service = new FargateService(this, "EdgeDbService", {
      // even in dev mode we never want to assign public ips.. we always want to access via network load balancer
      assignPublicIp: false,
      cluster: cluster,
      desiredCount: props.desiredCount,
      taskDefinition: taskDefinition,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });
  }

  public get service(): FargateService {
    return this._service;
  }

  public get servicePort(): number {
    return this.EDGE_DB_PORT;
  }
}
