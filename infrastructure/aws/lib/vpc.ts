import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { IVpc } from "aws-cdk-lib/aws-ec2";

/**
 * The smart VPC construct allows us to either inherit an existing VPC, or create a new VPC
 * based purely on the name or id passed in.
 *
 * @param scope
 * @param id
 * @param vpcNameOrDefaultOrNull either an existing VPC id, the string "default", or null to indicate a new VPC should be created
 */
export function smartVpcConstruct(
  scope: Construct,
  id: string,
  vpcNameOrDefaultOrNull: string | "default" | null
): IVpc {
  // if not vpc details are given then we construct a new VPC
  if (!vpcNameOrDefaultOrNull) {
    return new NatVPC(scope, id);
  }

  // if they ask for the special name default then we use the VPC defaulting mechanism (via CDK lookup)
  if (vpcNameOrDefaultOrNull === "default")
    return ec2.Vpc.fromLookup(scope, id, {
      isDefault: true,
    });

  // otherwise look up the actual name given
  return ec2.Vpc.fromLookup(scope, id, {
    vpcName: vpcNameOrDefaultOrNull,
  });
}

class NatVPC extends ec2.Vpc {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      maxAzs: 99, // 99 will mean that the VPC expands to consume as many AZs as it can in the region
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "ingress",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: "application",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          name: "database",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      // gateway endpoints are free and help avoid NAT traffic... there is no point in
      // not having them by default
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
