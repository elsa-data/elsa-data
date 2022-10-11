import { Construct } from "constructs";
import { aws_ec2 as ec2 } from "aws-cdk-lib";

export abstract class BaseDatabase extends Construct {
  protected constructor(scope: Construct, id: string) {
    super(scope, id);
  }

  public abstract connections(): ec2.Connections;
}
