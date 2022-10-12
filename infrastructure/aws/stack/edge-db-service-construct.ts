import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_iam as iam,
  aws_logs as logs,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CpuArchitecture,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
  OperatingSystemFamily,
  Protocol,
} from "aws-cdk-lib/aws-ecs";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";

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

  // if present the ecs env secret for CA to set for certs
  certificateCertSecret?: ecs.Secret;
  certificateKeySecret?: ecs.Secret;

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
      family: "edge-db-service-family",
    });

    const containerName = "edge-db";

    const env: { [k: string]: string } = {
      // EDGEDB_SERVER_SECURITY: "insecure_dev_mode",
      EDGEDB_DOCKER_LOG_LEVEL: "debug",
      // the DSN (including postgres user/pw) pointing to the base database
      EDGEDB_SERVER_BACKEND_DSN: props.baseDbDsn,
      // we allow the superuser name to be set
      EDGEDB_SERVER_USER: props.superUser,
    };

    const secrets: { [k: string]: ecs.Secret } = {
      // CDK is smart enough to grant permissions to read these secrets to the execution role
      EDGEDB_SERVER_PASSWORD: ecs.Secret.fromSecretsManager(
        props.superUserSecret
      ),
    };

    // if we have been passed in certificate details then use them
    // else make it generate its own
    if (props.certificateKeySecret && props.certificateCertSecret) {
      env.EDGEDB_SERVER_TLS_CERT_MODE = "require_file";
      secrets.EDGEDB_SERVER_TLS_CERT = props.certificateCertSecret;
      secrets.EDGEDB_SERVER_TLS_KEY = props.certificateKeySecret;
    } else {
      // when putting a TLS terminated network load balancer in front of this - we can
      // use a self-signed cert as the internal target TLS
      // NLBs are comfortable using self-signed certs purely for traffic encryption
      // https://kevin.burke.dev/kevin/aws-alb-validation-tls-reply/
      // that way we can avoid needing to manage custom certs/cas
      env.EDGEDB_SERVER_TLS_CERT_MODE = "generate_self_signed";
    }

    if (props.isDevelopment) env.EDGEDB_SERVER_ADMIN_UI = "enabled";

    console.log(env);
    console.log(secrets);

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
      protocol: Protocol.TCP,
    });

    this._service = new FargateService(this, "EdgeDbService", {
      // even in dev mode we never want to assign public ips.. we always want to access via network load balancer
      assignPublicIp: false,
      cluster: cluster,
      desiredCount: props.desiredCount,
      taskDefinition: taskDefinition,
      vpcSubnets: {
        // we need egress in order to fetch images?? if we setup with private link maybe avoid? one to investigate?
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
