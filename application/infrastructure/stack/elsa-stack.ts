import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { ElsaEdgedbStack } from "../lib/elsa-edgedb";
import { ElsaVPC } from "../lib/vpc";

export class ElsaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const nameSpace = this.node.tryGetContext("nameSpace");
    // this.vpc = new ElsaVPC(this, `${nameSpace}VPC`).vpc;
    // Using main-dev VPC for temporary
    const vpc = ec2.Vpc.fromLookup(this, "UMCCRMainVPC", {
      vpcId:  this.node.tryGetContext("umccrMainVpcId")
    });

    const elsaEdgedb = new ElsaEdgedbStack(this, "DatabaseStack", {
      vpc: vpc,
    });
  }
}
