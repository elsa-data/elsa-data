# Elsa Infrastructure AWS-CDK

This is elsa project for CDK development with TypeScript.

## Predeployment

There are some stuff to make sure it exist before any of the deployment.

- **TLS certificate**

  For time being, TLS certificate will be generated manually and be kept in the SecretManager. The name of secretManager
  is passed into the stack so that the stack could reference the TLS certificate and TLS key.

  **Generating self-signed server certificate**  
  There are many blogs and tutorials to generate self-signed
  certificate. [This](https://devopscube.com/create-self-signed-certificates-openssl/) is one of the blog that is handy
  to create self-signed certificates. After generating, put the domain certifcate (`domain name` followed by `.crt`) and
  private key (`domain name` followed by `.key`) to AWS Secret Manager.

  NOTE: Using self-signed certificate will require `rootCA.crt` (root certificate) to be included in edgedb client when
  connecting it with edgedb server.
  See [edgedb connection config](https://www.edgedb.com/docs/cli/edgedb_connopts#ref-cli-edgedb-connopts).

  **Saving Certificate to Secret Manager**  
  Keys and Certificate will be stored in AWS Secret Manager that would be accessed by edgedb. Store this in the plain
  type scret
  manager. [Here](https://medium.com/@nilouferbustani/securing-ssh-private-keys-using-aws-secrets-manager-6d93537c1037)
  is a blog on how to store plain text secret manager (Follow step 1).

  By default or current configuration the naming of these secret manager are:

  - `elsa/tls/key` - for the key
  - `elsa/tls/cert` - for the certificate
  - `elsa/tls/rootCA` - for the root certificate when self-signed

## Stacks

- elsaDatabaseStack

  The stack will spin up aws resource to get edgedb up and running. The stack will spin up RDS Postgres, ECS-fargate and
  will output the edgedb-server url endpoint to be used in the applicaton.

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
      tlsKeySecretManagerName: string; // TLS key in secret manager (Must existed before deployment)
      tlsCertSecretManagerName: string;  // TLS cert in secret manager (Must existed before deployment)
      serverCredentialSecretManagerName: string;  // Desired secret manager name for edgedb password
    };
  };
  ```

## Development

In this directory, the following are the useful command

- `npm run cdk-deploy` deploy _all_ stack to your default AWS account/region
- `npm run cdk diff` compare deployed stack with current state
- `npm run cdk synth` emits the synthesized CloudFormation template
