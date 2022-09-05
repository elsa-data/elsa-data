import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_ecs_patterns as ecs_p,
  aws_elasticloadbalancingv2 as elbv2,
  aws_iam as iam,
  aws_logs as logs,
  aws_rds as rds,
  aws_route53 as route53,
  aws_secretsmanager as secretsmanager,
  CfnOutput,
  Duration,
  NestedStack,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { PostgresEngineVersion } from "aws-cdk-lib/aws-rds";
import { InstanceClass, InstanceSize, InstanceType } from "aws-cdk-lib/aws-ec2";

interface Props extends StackProps {
  vpc: ec2.IVpc;
  hostedZone: route53.IHostedZone;
  config: {
    isHighlyAvailable: boolean;
    rds: {
      clusterIdentifier: string;
      dbName: string;
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
      customDomain: string;
      tlsKeySecretManagerName: string;
      tlsCertSecretManagerName: string;
      serverCredentialSecretManagerName: string;
    };
  };
}

export class EdgeDbStack extends NestedStack {
  // we need to output a Url that can be used to connect to this Edge Db
  // (we make this both a CfnOutput and a literal output of the Stack)
  public readonly edgeDbUrl: string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const vpc = props.vpc;
    const hostedZone = props.hostedZone;
    const config = props.config;

    /*******************************
     * Database
     *******************************/

    // create a secret for RDS that we don't need to see/know about
    const rdsSecret = new secretsmanager.Secret(this, "RdsSecret", {
      generateSecretString: {
        excludePunctuation: true,
        secretStringTemplate: JSON.stringify({
          username: "postgres",
          password: "",
        }),
        generateStringKey: "password",
      },
    });

    const rdsInstance = new rds.DatabaseInstance(this, "RdsInstance", {
      removalPolicy: RemovalPolicy.DESTROY,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_14,
      }),
      credentials: rds.Credentials.fromSecret(rdsSecret),
      databaseName: config.rds.dbName,
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE4_GRAVITON,
        InstanceSize.SMALL,
      ),
      deletionProtection: false, // For DEV purposes
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      // securityGroups: [securityGroup],
    });

    // RDS Cluster
    /*const rdsCluster = new rds.DatabaseCluster(this, "RDSDatabaseCluster", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_7,
      }),
      instanceProps: {
        vpc: vpc,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE4_GRAVITON,
          ec2.InstanceSize.SMALL
        ),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      },
      clusterIdentifier: config.rds.clusterIdentifier,
      credentials: rds.Credentials.fromSecret(rdsSecret),
      defaultDatabaseName: config.rds.dbName,
      deletionProtection: false, // For DEV purposes
      instances: config.isHighlyAvailable ? 2 : 1,
      removalPolicy: RemovalPolicy.DESTROY,
    }); */

    const rdsDatabaseDsn =
      `postgres://` +
      `${rdsSecret.secretValueFromJson("username").unsafeUnwrap()}` +
      `:` +
      `${rdsSecret.secretValueFromJson("password").unsafeUnwrap()}` +
      `@` +
      `${rdsInstance.dbInstanceEndpointAddress}` +
      `:` +
      `${rdsInstance.dbInstanceEndpointPort}` +
      `/` +
      `${rdsSecret.secretValueFromJson("dbname").unsafeUnwrap()}`;

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
          "service-role/AmazonECSTaskExecutionRolePolicy",
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
        // secretName: config.edgedb.serverCredentialSecretManagerName,
        generateSecretString: {
          excludePunctuation: true,
        },
      },
    );

    const tlsSecretCert = secretsmanager.Secret.fromSecretNameV2(
      this,
      "elsaTlsSecretManagerCert",
      config.edgedb.tlsCertSecretManagerName,
    );

    const tlsSecretKey = secretsmanager.Secret.fromSecretNameV2(
      this,
      "elsaTlsSecretManagerKey",
      config.edgedb.tlsKeySecretManagerName,
    );

    const ecsElsaFargateService = new ecs_p.NetworkLoadBalancedFargateService(
      this,
      "EdgeDBService",
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
          image: ecs.ContainerImage.fromRegistry("edgedb/edgedb:2.0"),
          containerName: "edgedb",
          environment: {
            EDGEDB_SERVER_TLS_CERT_MODE: "require_file",
            EDGEDB_SERVER_BACKEND_DSN: rdsDatabaseDsn,
            EDGEDB_SERVER_USER: config.edgedb.user,
            EDGEDB_SERVER_DATABASE: config.edgedb.dbName,
            EDGEDB_SERVER_PORT: config.edgedb.port,
          },
          secrets: {
            // By default cdk will grant read access in ecsExecutionRole to read the Secret Manager
            EDGEDB_SERVER_PASSWORD: ecs.Secret.fromSecretsManager(
              edgeDBServerPasswordSecret,
            ),
            EDGEDB_SERVER_TLS_KEY: ecs.Secret.fromSecretsManager(tlsSecretKey),
            EDGEDB_SERVER_TLS_CERT:
              ecs.Secret.fromSecretsManager(tlsSecretCert),
          },
          containerPort: config.ecs.port,
          executionRole: ecsExecutionRole,
          family: "elsa-task-definition",
          logDriver: ecs.LogDriver.awsLogs({
            streamPrefix: "elsa/db",
            logGroup: clusterLogGroup,
          }),
        },
      },
    );

    // Configure healthcheck
    ecsElsaFargateService.targetGroup.configureHealthCheck({
      enabled: true,
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
      protocol: elbv2.Protocol.HTTPS,
      path: "/server/status/ready",
      interval: Duration.seconds(10),
    });

    // Giving correct SG permission between rds and fargate
    //rdsCluster.connections.allowDefaultPortFrom(ecsElsaFargateService.service);
    rdsInstance.connections.allowDefaultPortFrom(ecsElsaFargateService.service);
    ecsElsaFargateService.service.connections.allowFromAnyIpv4(
      ec2.Port.tcp(config.ecs.port),
    );

    // Adding custom hostname to UMCCR route53
    new route53.CnameRecord(this, `EdgeDBCname`, {
      domainName: ecsElsaFargateService.loadBalancer.loadBalancerDnsName,
      zone: hostedZone,
      recordName: config.edgedb.customDomain,
    });

    // Setting variable
    this.edgeDbUrl =
      `edgedb://` +
      `${config.edgedb.user}` +
      `:` +
      `${edgeDBServerPasswordSecret.secretValue.unsafeUnwrap()}` +
      `@` +
      `${config.edgedb.customDomain}` +
      `:` +
      `${config.edgedb.port}` +
      `/` +
      `${config.edgedb.dbName}`;

    // EdgeDb DSN Url
    new CfnOutput(this, "EdgeDbUrl", {
      value: this.edgeDbUrl,
    });
  }
}
