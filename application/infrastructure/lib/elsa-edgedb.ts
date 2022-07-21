import {
  Stack,
  StackProps,
  RemovalPolicy,
  Duration,
  CfnOutput,
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
  aws_route53 as route53,
} from "aws-cdk-lib";

interface ElsaEdgedbStackProps extends StackProps {
  vpc: ec2.IVpc;
  hostedZone: route53.IHostedZone;
  config: {
    isHighlyAvailable: boolean;
    rds: {
      clusterIdentifier: string;
      dbName: string;
      dsnRdsSecretManagerName: string;
    };
    ecs: {
      serviceName: string;
      clusterName: string;
      cpu: number;
      memory: number;
      port: number;
    };
    edgedb: {
      dbName: string;
      user: string;
      port: string;
    };
  };
}

export class ElsaEdgedbStack extends Stack {
  // EdgeDb DSN url for elsa
  public readonly elsaEdgedbUrl: string;

  constructor(scope: Construct, id: string, props: ElsaEdgedbStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;
    const hostedZone = props.hostedZone;
    const config = props.config;

    /*******************************
     * Database
     *******************************/

    // Create RDS Secret
    const rdsClusterSecret = new secretsmanager.Secret(this, "AuroraPassword", {
      generateSecretString: {
        excludePunctuation: true,
        secretStringTemplate: JSON.stringify({
          username: "postgres",
          password: "",
        }),
        generateStringKey: "password",
      },
    });

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
      clusterIdentifier: config.rds.clusterIdentifier,
      credentials: rds.Credentials.fromSecret(rdsClusterSecret),
      defaultDatabaseName: config.rds.dbName,
      deletionProtection: false, // For DEV purposes
      instances: config.isHighlyAvailable ? 2 : 1,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const rdsDatabaseDsn =
      `postgres://` +
      `${rdsClusterSecret.secretValueFromJson("username").unsafeUnwrap()}` +
      `:` +
      `${rdsClusterSecret.secretValueFromJson("password").unsafeUnwrap()}` +
      `@` +
      `${rdsCluster.clusterEndpoint.hostname}` +
      `:` +
      `${rdsClusterSecret.secretValueFromJson("port").unsafeUnwrap()}` +
      `/` +
      `${rdsClusterSecret.secretValueFromJson("dbname").unsafeUnwrap()}`;

    /*******************************
     * ECS for EdgeDb protocol
     *******************************/

    const ecsCluster = new ecs.Cluster(this, "ECSCluster", {
      vpc: vpc,
      clusterName: config.ecs.clusterName,
    });

    const ecsExecutionRole = new iam.Role(this, "ECSExecutionRole", {
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

    const edgeDBServerPasswordSecret = new secretsmanager.Secret(
      this,
      "EdgeDBServerPassword",
      {
        generateSecretString: {
          excludePunctuation: true,
        },
      }
    );

    const ecsElsaFargateService = new ecs_p.NetworkLoadBalancedFargateService(
      this,
      "ECSService",
      {
        assignPublicIp: true,
        cluster: ecsCluster,
        cpu: config.ecs.cpu,
        desiredCount: config.isHighlyAvailable ? 2 : 1,
        memoryLimitMiB: config.ecs.memory,
        publicLoadBalancer: true,
        serviceName: config.ecs.serviceName,
        listenerPort: config.ecs.port,
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry("edgedb/edgedb"),
          containerName: "edgedb",
          environment: {
            EDGEDB_SERVER_TLS_CERT_MODE: "generate_self_signed",
            EDGEDB_SERVER_BACKEND_DSN: rdsDatabaseDsn,
            EDGEDB_SERVER_USER: config.edgedb.user,
            EDGEDB_SERVER_DATABASE: config.edgedb.dbName,
            EDGEDB_SERVER_PORT: config.edgedb.port,
          },
          secrets: {
            EDGEDB_SERVER_PASSWORD: ecs.Secret.fromSecretsManager(
              edgeDBServerPasswordSecret
            ),
          },
          containerPort: config.ecs.port,
          executionRole: ecsExecutionRole,
          family: "elsa-task-defintion",
          logDriver: ecs.LogDriver.awsLogs({
            streamPrefix: "elsa/db",
            logGroup: clusterLogGroup,
          }),
        },
      }
    );

    // Configure healtcheck
    ecsElsaFargateService.targetGroup.configureHealthCheck({
      enabled: true,
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
      protocol: elbv2.Protocol.HTTPS,
      path: "/server/status/ready",
      interval: Duration.seconds(10),
    });

    // Giving correct SG permission between rds and fargate
    rdsCluster.connections.allowDefaultPortFrom(ecsElsaFargateService.service);
    ecsElsaFargateService.service.connections.allowFromAnyIpv4(
      ec2.Port.tcp(config.ecs.port)
    );

    // Adding custom hostname to UMCCR route53
    new route53.CnameRecord(this, `elsaEdgedbRoute53`, {
      domainName: ecsElsaFargateService.loadBalancer.loadBalancerDnsName,
      zone: hostedZone,
      recordName: `elsa.${hostedZone.zoneName}`,
    });

    // Setting viarble
    this.elsaEdgedbUrl = `edgedb://${
      config.edgedb.user
    }:${edgeDBServerPasswordSecret.secretValue.unsafeUnwrap()}@elsa.${
      hostedZone.zoneName
    }:${config.edgedb.port}/${config.edgedb.dbName}`;

    // Edgedb DSN
    new CfnOutput(this, "elsaEdgeDbUrl", {
      value: this.elsaEdgedbUrl,
    });
  }
}
