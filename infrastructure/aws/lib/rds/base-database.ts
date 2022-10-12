import { Construct } from "constructs";
import { aws_ec2 as ec2 } from "aws-cdk-lib";

export abstract class BaseDatabase extends Construct {
  protected constructor(scope: Construct, id: string) {
    super(scope, id);
  }

  public abstract get dsn(): string;

  public abstract get hostname(): string;

  public abstract get port(): number;

  public abstract connections(): ec2.Connections;
}
