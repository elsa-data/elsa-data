import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class ElsaVPC extends ec2.Vpc {
  public readonly vpc: ec2.Vpc;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      maxAzs: 99, // Maximum AZ in the region
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "ingress",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: "application",
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
        {
          name: "database",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
        Dynamo: {
          service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        },
      },
    });
  }
}
