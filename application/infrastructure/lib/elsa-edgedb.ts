import {
  Stack,
  StackProps,
  RemovalPolicy,
  Duration,
  SecretValue,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_ec2 as ec2,
  aws_rds as rds,
  aws_ecs_patterns as ecs_p,
  aws_ecs as ecs,
  aws_iam as iam,
  aws_logs as logs,
  aws_secretsmanager as secretsmanager,
  aws_elasticloadbalancingv2 as elbv2,
} from "aws-cdk-lib";

interface ElsaEdgedbStackProps extends StackProps {
  vpc: ec2.IVpc;
}

export class ElsaEdgedbStack extends Stack {
  constructor(scope: Construct, id: string, props: ElsaEdgedbStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    /*******************************/
    // TODO: Put inside context
    const rdsProps = {
      clusterIdentifier: `elsaRDSCluster`,
      dbName: `elsaDb`,
    };
    const ecsProps = {
      serviceName: "Elsa",
      clusterName: "ElsaEdgeDb",
      cpu: 1024,
      memory: 2048,
      desiredCount: 1,
      port: 5656,
    };
    /*******************************/

    /*******************************
     * Database
     *******************************/

    // Create RDS Secret
    const rdsDatabaseSecret = new rds.DatabaseSecret(
      this,
      "RDSSecretManagerCredentials",
      {
        username: "postgres",
        secretName: "ElsaRDS",
      }
    );
    const rdsCredentials = rds.Credentials.fromSecret(rdsDatabaseSecret);

    // RDS Cluster
    const rdsCluster = new rds.DatabaseCluster(this, "RDSDatabaseCluster", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_4,
      }),
      instanceProps: {
        vpc: vpc,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.MEDIUM
        ),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      },
      clusterIdentifier: rdsProps.clusterIdentifier,
      credentials: rdsCredentials,
      defaultDatabaseName: rdsProps.dbName,
      deletionProtection: false, // For DEV purposes
      instances: 1,
      port: 5432,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const rdsDatabaseClusterDSN = new secretsmanager.Secret(
      this,
      "RdsDatabaseClusterDSN",
      {
        secretStringValue: SecretValue.unsafePlainText(
          `postgres://${rdsDatabaseSecret
            .secretValueFromJson("username")
            .unsafeUnwrap()}:${rdsDatabaseSecret
            .secretValueFromJson("password")
            .unsafeUnwrap()}@${
            rdsCluster.clusterEndpoint.hostname
          }:${rdsDatabaseSecret
            .secretValueFromJson("port")
            .unsafeUnwrap()}/${rdsDatabaseSecret
            .secretValueFromJson("dbname")
            .unsafeUnwrap()}`
        ),
      }
    );

    /*******************************
     * ECS for DB access
     *******************************/

    const ecsCluster = new ecs.Cluster(this, "ECSCluster", {
      vpc: vpc,
      clusterName: ecsProps.clusterName,
    });

    // ECS execution role
    const ecsExecutionRole = new iam.Role(this, "ECSExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSTaskExecutionRolePolicy"
        ),
      ],
    });
    // Grant read access to secret manager
    rdsDatabaseSecret.grantRead(ecsExecutionRole);
    rdsDatabaseClusterDSN.grantRead(ecsExecutionRole);

    const clusterLogGroup = new logs.LogGroup(this, "ServiceLog", {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    const ecsElsaFargateService =
      new ecs_p.ApplicationLoadBalancedFargateService(this, "ECSService", {
        assignPublicIp: true,
        cluster: ecsCluster,
        cpu: ecsProps.cpu,
        desiredCount: ecsProps.desiredCount,
        memoryLimitMiB: ecsProps.memory,
        publicLoadBalancer: true,
        redirectHTTP: false,
        serviceName: ecsProps.serviceName,
        listenerPort: ecsProps.port,
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry("edgedb/edgedb"),
          containerName: "edgedb",
          environment: {
            EDGEDB_SERVER_TLS_CERT_MODE: "generate_self_signed",
          },
          secrets: {
            EDGEDB_SERVER_PASSWORD:
              ecs.Secret.fromSecretsManager(rdsDatabaseSecret),
            EDGEDB_SERVER_BACKEND_DSN: ecs.Secret.fromSecretsManager(
              rdsDatabaseClusterDSN
            ),
          },
          containerPort: ecsProps.port,
          executionRole: ecsExecutionRole,
          family: "elsa-task-defintion",
          logDriver: ecs.LogDriver.awsLogs({
            streamPrefix: "elsa/db",
            logGroup: clusterLogGroup,
          }),
        },
      });
    ecsElsaFargateService.targetGroup.configureHealthCheck({
      enabled: true,
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
      protocol: elbv2.Protocol.HTTPS,
      path: "/server/status/ready",
      interval: Duration.seconds(10),
    });

    rdsCluster.connections.allowDefaultPortFrom(ecsElsaFargateService.service);
    ecsElsaFargateService.service.connections.allowFromAnyIpv4(
      ec2.Port.tcp(ecsProps.port)
    );
  }
}
