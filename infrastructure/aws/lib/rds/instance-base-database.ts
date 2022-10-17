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

/**
 * A construct representing the base database we might use with EdgeDb - in this
 * case representing a simple Postgres instance.
 */
export class InstanceBaseDatabase extends BaseDatabase {
  private readonly _instance: DatabaseInstance;
  private readonly _dsn: string;

  constructor(scope: Construct, id: string, props: InstanceBaseDatabaseProps) {
    super(scope, id);

    this._instance = new DatabaseInstance(scope, "DatabaseInstance", {
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
        subnetType: props.isDevelopment
          ? ec2.SubnetType.PUBLIC
          : ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    this._dsn =
      `postgres://` +
      `${props.secret.secretValueFromJson("username").unsafeUnwrap()}` +
      `:` +
      `${props.secret.secretValueFromJson("password").unsafeUnwrap()}` +
      `@${this.hostname}:${this._instance.dbInstanceEndpointPort}/${props.databaseName}`;
  }

  public get dsn(): string {
    return this._dsn;
  }

  public get hostname(): string {
    return this._instance.instanceEndpoint.hostname;
  }

  public get port(): number {
    return this._instance.instanceEndpoint.port;
  }

  public connections() {
    return this._instance.connections;
  }
}
