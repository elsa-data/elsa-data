import { Construct } from "constructs";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { SslPolicy } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { IVpc, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import {
  Cluster,
  ContainerImage,
  CpuArchitecture,
  FargateTaskDefinition,
  LogDrivers,
  OperatingSystemFamily,
  Secret,
} from "aws-cdk-lib/aws-ecs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";

type Props = {
  // the VPC to place the cluster in
  vpc: IVpc;

  // the details of the domain name entry to construct as the ALB entrypoint
  hostedPrefix: string;
  hostedZoneName: string;
  hostedZoneCertArn: string;

  // the Docker image to run as the service
  imageAsset: DockerImageAsset;

  // env variables to pass to the Docker image
  environment: { [p: string]: string };

  // secrets that can be expanded out in the environment on spin up (hidden from AWS console) NOTE: ecs Secrets, not Secret Manager secrets
  secrets: { [p: string]: Secret };

  // details of the fargate
  memoryLimitMiB: number;
  cpu: number;
  containerName: string;
  desiredCount: number;
  healthCheckPath?: string;
};

/**
 * Creates a Docker based service in Fargate fronted by a SSL load balancer.
 */
export class DockerServiceWithHttpsLoadBalancerConstruct extends Construct {
  public readonly cluster: Cluster;
  public readonly service: ApplicationLoadBalancedFargateService;
  public readonly clusterLogGroup: LogGroup;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    // we have been passed in the values of an existing SSL cert and domain name in Route 53
    // need to make CDK handles for them via lookups
    const certificate = Certificate.fromCertificateArn(
      this,
      "SslCert",
      props.hostedZoneCertArn
    );
    const domainZone = HostedZone.fromLookup(this, "Zone", {
      domainName: props.hostedZoneName,
    });

    // a cluster to run things on (will end up being a fargate cluster - so not actual ec2 instances)
    this.cluster = new Cluster(this, "Cluster", {
      vpc: props.vpc,
    });

    this.clusterLogGroup = new LogGroup(this, "ServiceLog", {
      retention: RetentionDays.ONE_WEEK,
    });

    // we do the task definition by hand as we have some specialised settings
    const taskDefinition = new FargateTaskDefinition(this, "TaskDef", {
      runtimePlatform: {
        operatingSystemFamily: OperatingSystemFamily.LINUX,
        cpuArchitecture: CpuArchitecture.ARM64,
      },
      memoryLimitMiB: props.memoryLimitMiB,
      cpu: props.cpu,
      // were we to need to make these anything but default this is where
      // executionRole: taskImageOptions.executionRole,
      // taskRole: taskImageOptions.taskRole,
      // family: taskImageOptions.family,
    });

    const containerName = props.containerName;
    const container = taskDefinition.addContainer(containerName, {
      image: ContainerImage.fromDockerImageAsset(props.imageAsset),
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
      environment: props.environment,
      secrets: props.secrets,
      logging: LogDrivers.awsLogs({
        streamPrefix: "elsa",
        logGroup: this.clusterLogGroup,
      }),
    });
    container.addPortMappings({
      containerPort: 80,
    });

    // a load balanced fargate service hosted on an SSL host
    this.service = new ApplicationLoadBalancedFargateService(this, "Service", {
      cluster: this.cluster,
      certificate: certificate,
      sslPolicy: SslPolicy.RECOMMENDED,
      domainName: `${props.hostedPrefix}.${props.hostedZoneName}`,
      domainZone: domainZone,
      redirectHTTP: true,
      desiredCount: props.desiredCount,
      publicLoadBalancer: true,
      // securityGroups: props.securityGroups,
      taskDefinition: taskDefinition,
    });

    if (props.healthCheckPath) {
      this.service.targetGroup.configureHealthCheck({
        path: props.healthCheckPath,
      });
    }
  }
}
