import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  IVpc,
} from "aws-cdk-lib/aws-ec2";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { aws_ec2 as ec2, aws_rds as rds, RemovalPolicy } from "aws-cdk-lib";
import { DatabaseInstance, PostgresEngineVersion } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { BaseDatabase } from "./base-database";

export interface InstanceBaseDatabaseProps {
  isDevelopment?: boolean;

  databaseName: string;

  vpc: IVpc;

  secret: ISecret;
}

export class InstanceBaseDatabase extends BaseDatabase {
  private readonly instance: DatabaseInstance;
  private readonly dsnString: string;

  constructor(scope: Construct, id: string, props: InstanceBaseDatabaseProps) {
    super(scope, id);

    this.instance = new DatabaseInstance(scope, "DatabaseInstance", {
      removalPolicy: props.isDevelopment
        ? RemovalPolicy.DESTROY
        : RemovalPolicy.SNAPSHOT,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_14,
      }),
      credentials: rds.Credentials.fromSecret(props.secret),
      databaseName: props.databaseName,
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE4_GRAVITON,
        InstanceSize.SMALL
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      // securityGroups: [securityGroup],
    });

    this.dsnString =
      `postgres://` +
      `${props.secret.secretValueFromJson("username").unsafeUnwrap()}` +
      `:` +
      `${props.secret.secretValueFromJson("password").unsafeUnwrap()}` +
      `@` +
      `${this.instance.dbInstanceEndpointAddress}` +
      `:` +
      `${this.instance.dbInstanceEndpointPort}` +
      `/` +
      `${props.secret.secretValueFromJson("dbname").unsafeUnwrap()}`;
  }

  public get dsn() {
    return this.dsnString;
  }

  public connections() {
    return this.instance.connections;
  }
}
