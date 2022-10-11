import { aws_ec2 as ec2 } from "aws-cdk-lib";
import { Construct } from "constructs";
import { FargateService } from "aws-cdk-lib/aws-ecs";
import {
  HealthCheck,
  NetworkLoadBalancer,
  Protocol,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, IHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { SubnetType } from "aws-cdk-lib/aws-ec2";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";

interface Props {
  isDevelopment?: boolean;

  // the VPC that the load balancer will live in
  vpc: ec2.IVpc;

  // the port that the load balancer will listen on
  port: number;

  hostedPrefix: string;
  hostedZone: IHostedZone;
  hostedCertificate: ICertificate;

  // the service we will balance to
  service: FargateService;

  // the service port we will balance to
  servicePort: number;

  // the service health check (if defined)
  serviceHealthCheck?: HealthCheck;
}

/**
 */
export class EdgeDbLoadBalancerConstruct extends Construct {
  private readonly _lb: NetworkLoadBalancer;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this._lb = new NetworkLoadBalancer(this, "LoadBalancer", {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: props.isDevelopment
          ? SubnetType.PUBLIC
          : SubnetType.PRIVATE_WITH_EGRESS,
      },
      internetFacing: !!props.isDevelopment,
    });

    const listener = this._lb.addListener("PublicListener", {
      port: props.port,
      certificates: [props.hostedCertificate],
      protocol: Protocol.TLS,
    });

    const tg = listener.addTargets("ECS", {
      port: props.servicePort,
      protocol: Protocol.TLS,
      targets: [props.service],
    });

    // configure healthcheck if given
    if (props.serviceHealthCheck)
      tg.configureHealthCheck(props.serviceHealthCheck);

    new ARecord(this, "DNS", {
      zone: props.hostedZone,
      recordName: props.hostedPrefix,
      target: RecordTarget.fromAlias(new LoadBalancerTarget(this._lb)),
    });
  }

  public get loadBalancer(): NetworkLoadBalancer {
    return this._lb;
  }
}
