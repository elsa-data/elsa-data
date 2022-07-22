# Elsa Infrastructure AWS-CDK

This is elsa project for CDK development with TypeScript.


## Stacks

- elsaDatabaseStack
 
  The stack will spin up aws resource to get edgedb up and running. The stack will spin up RDS Postgres, ECS-fargate and will output the edgedb-server url endpoint to be used in the applicaton. 

  There is some configuration needed to spin up these resources
  ```
  vpc: ec2.IVpc;  // VPC where the db need to deployed
  hostedZone: route53.IHostedZone;  // HostedZone where custom domain live
  config: {
    isHighlyAvailable: boolean;  // Configure if need highly avail (will spin at least 2 container when set to true)
    rds: {
      clusterIdentifier: string;
      dbName: string;
      dsnRdsSecretManagerName: string;  // The name of secret manager to store Postgres password
    };
    ecs: {
      serviceName: string;
      clusterName: string;
      cpu: number;
      memory: number;
      port: number;  // ECS listener and container port
    };
    edgedb: {
      dbName: string;
      user: string;
      port: string;  // EdgeDb Port
      customDomain: string;  // Custom domain for edgedb-server to run
    };
  };
  ```


## Development
In this directory, the following are the useful command

* `npm run cdk-deploy`      deploy *all* stack to your default AWS account/region
* `npm run cdk diff`        compare deployed stack with current state
* `npm run cdk synth`       emits the synthesized CloudFormation template
