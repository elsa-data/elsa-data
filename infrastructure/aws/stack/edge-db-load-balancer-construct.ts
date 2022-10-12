import { aws_ec2 as ec2 } from "aws-cdk-lib";
import { Construct } from "constructs";
import { FargateService } from "aws-cdk-lib/aws-ecs";
import {
  HealthCheck,
  NetworkLoadBalancer,
  Protocol,
  SslPolicy,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, IHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { SubnetType } from "aws-cdk-lib/aws-ec2";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";

interface Props {
  isDevelopment?: boolean;

  // the VPC that the load balancer will live in
  vpc: ec2.IVpc;

  // the name record that will be set up for the load balancer
  hostedPrefix: string;
  hostedZone: IHostedZone;

  // the port that the load balancer will listen on for TCP passthrough work
  tcpPassthroughPort: number;

  // optionally a port that will be listened on with TLS termination
  tlsTerminatePort?: number;
  tlsHostedCertificate?: ICertificate;

  // the service we will balance to
  service: FargateService;

  // the service port we will balance to
  servicePort: number;

  // the service health check (if defined)
  serviceHealthCheck?: HealthCheck;
}

/**
 * A network load balancer that can sit in front of a Fargate EdgeDb service.
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

    new ARecord(this, "DNS", {
      zone: props.hostedZone,
      recordName: props.hostedPrefix,
      target: RecordTarget.fromAlias(new LoadBalancerTarget(this._lb)),
    });

    // the main required load balancer is TCP traffic that comes in
    // that we relay directly to the EdgeDb service (where it does it own TLS layer)
    {
      const tcpListener = this._lb.addListener("TcpListener", {
        port: props.tcpPassthroughPort,
        protocol: Protocol.TCP,
      });

      const tg = tcpListener.addTargets("TcpTargetGroup", {
        port: props.servicePort,
        protocol: Protocol.TCP,
        targets: [props.service],
      });

      // configure healthcheck if given
      if (props.serviceHealthCheck)
        tg.configureHealthCheck(props.serviceHealthCheck);
    }

    // optionally we can also set up another port where the NLB will terminate TLS for us
    if (props.tlsTerminatePort && props.tlsHostedCertificate) {
      const tlsListener = this._lb.addListener("TlsListener", {
        port: props.tlsTerminatePort,
        certificates: [props.tlsHostedCertificate],
        protocol: Protocol.TLS,
        sslPolicy: SslPolicy.RECOMMENDED,
      });

      const tg = tlsListener.addTargets("TlsTargetGroup", {
        port: props.servicePort,
        protocol: Protocol.TLS,
        targets: [props.service],
      });

      tg.setAttribute("preserve_client_ip.enabled", "true");
      //tg.setAttribute("proxy_protocol_v2.enabled", "true");
      //tg.setAttribute("deregistration_delay.connection_termination.enabled", "true");
      tg.setAttribute("deregistration_delay.timeout_seconds", "15");
    }
  }

  public get loadBalancer(): NetworkLoadBalancer {
    return this._lb;
  }
}
