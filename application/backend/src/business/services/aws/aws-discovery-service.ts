import { inject, injectable } from "tsyringe";
import { ElsaSettings } from "../../../config/elsa-settings";
import { Logger } from "pino";
import {
  DiscoverInstancesCommand,
  ServiceDiscoveryClient,
} from "@aws-sdk/client-servicediscovery";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { differenceInHours, differenceInMinutes, subHours } from "date-fns";

export type IAwsDiscoveryService = {
  locateCopyOutStepsArn(): Promise<string | undefined>;
  locateObjectSigningPair(): Promise<[string, string] | undefined>;
  locateBeaconLambdaArn(): Promise<string | undefined>;
};

/**
 * A type representing cached lookups we are making to discovery.
 */
type CachedLookup = {
  readonly serviceName: string;

  readonly attributeName: string | undefined;
  readonly attributeSecretName: string | undefined;

  lastAnyAttempt?: Date;
  lastSuccessfulAttempt?: Date;

  value?: string;
  secretValue?: any;
};

/**
 * The discovery service will be a common pattern for how Elsa discovers
 * other microservices dynamically - as the platform/stack outgrows a single
 * repo this will become increasingly important.
 *
 * This is currently a very simple AWS focussed version, to be refactored
 * once other deployment environments exist.
 */
@injectable()
export class AwsDiscoveryService implements IAwsDiscoveryService {
  constructor(
    @inject("Logger") private readonly logger: Logger,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("ServiceDiscoveryClient")
    private readonly serviceDiscoveryClient: ServiceDiscoveryClient,
    @inject("SecretsManagerClient")
    private readonly secretsManagerClient: SecretsManagerClient
  ) {
    logger.debug(
      "Created AwsDiscoveryService instance - expecting this to only happen once"
    );
  }

  private copyOutResult: CachedLookup = {
    serviceName: "CopyOut",
    attributeName: "stateMachineArn",
    attributeSecretName: undefined,
  };

  /**
   * Discover the ARN for the Copy Out steps function if it is present in our AWS
   * setup, or else return undefined. Caches the value.
   */
  public async locateCopyOutStepsArn(): Promise<string | undefined> {
    if (await this.discoverAttributeValueWithCaching(this.copyOutResult))
      return this.copyOutResult.value;

    return undefined;
  }

  private objectSigningResult: CachedLookup = {
    serviceName: "ObjectSigning",
    attributeName: undefined,
    attributeSecretName: "s3AccessKeySecretName", // pragma: allowlist secret
  };

  /**
   * Discover the IAM user and secret key for Object Signing if it is present
   * in our AWS setup, or else return undefined. Caches the value.
   */
  public async locateObjectSigningPair(): Promise<
    [string, string] | undefined
  > {
    if (
      await this.discoverAttributeValueWithCaching(this.objectSigningResult)
    ) {
      // the JSON comes back from our secret - the name of the fields in it are set by the
      // object signing stack. Be sure to keep in sync with below
      const pair = this.objectSigningResult.secretValue;

      return [pair.accessKeyId, pair.secretAccessKey];
    }
    return undefined;
  }

  private beaconLambdaResult: CachedLookup = {
    serviceName: "Beacon",
    attributeName: "lambdaArn",
    attributeSecretName: undefined,
  };

  /**
   * Discover the ARN for the Beacon lambda if it is present in our AWS
   * setup, or else return undefined. Caches the value.
   */
  public async locateBeaconLambdaArn(): Promise<string | undefined> {
    if (await this.discoverAttributeValueWithCaching(this.beaconLambdaResult))
      return this.beaconLambdaResult.value;

    return undefined;
  }

  /**
   * Using a special cache data structure, performs rate limited service discovery
   * of attributes and secrets from CloudMap.
   *
   * Return true if the passed in "cl" data structure now has valid values, and false if
   * it does not (i.e. if the lookup was unsuccessful).
   *
   * @param cl the mutable state cached lookup we are performing
   * @returns true if successful lookup (or successful cache lookup), false otherwise
   * @private
   */
  private async discoverAttributeValueWithCaching(cl: CachedLookup) {
    // if we have made a successful attempt in the past hour we do not attempt again - the cached value will do
    if (cl.lastSuccessfulAttempt)
      if (differenceInHours(new Date(), cl.lastSuccessfulAttempt) <= 1)
        return true;

    // if we have made any attempt in the last minute we skip doing anything...
    // secrets manager costs per API call and we definitely don't want to busy loop
    // the implication of this check is that we were _unsuccessful_ in a previous call - this is
    // going to return false again
    if (cl.lastAnyAttempt)
      if (differenceInMinutes(new Date(), cl.lastAnyAttempt) <= 1) return false;

    cl.lastAnyAttempt = new Date();

    try {
      // discover instances has a API quotes in the 1000s per second - so we don't really
      // worry too much about calling this a lot in the case where there is no service registered..
      // if successful however - we make sure we
      // cache the successful return value
      const command = new DiscoverInstancesCommand({
        NamespaceName: this.settings.serviceDiscoveryNamespace,
        ServiceName: cl.serviceName,
      });

      // note unlike what the documentation implies - if the service is not present
      // this call just returns an empty set of instances - not an error
      const response = await this.serviceDiscoveryClient.send(command);

      let v1;
      let v2;

      for (const i of response.Instances || []) {
        if (i.Attributes) {
          if (cl.attributeName) {
            if (cl.attributeName in i.Attributes) {
              v1 = i.Attributes[cl.attributeName];
            }
          }

          if (cl.attributeSecretName) {
            if (cl.attributeSecretName in i.Attributes) {
              v2 = i.Attributes[cl.attributeSecretName];
            }
          }
        }
      }

      if (cl.attributeName && !v1)
        throw new Error(`No attribute ${cl.attributeName}`);

      if (cl.attributeSecretName && !v2)
        throw new Error(`No attribute ${cl.attributeSecretName}`);

      if (cl.attributeName) {
        cl.value = v1;
      } else cl.value = undefined;

      if (cl.attributeSecretName) {
        // we want to look up the secret value
        const secretResult = await this.secretsManagerClient.send(
          new GetSecretValueCommand({
            SecretId: v2,
          })
        );

        if (secretResult.SecretString) v2 = secretResult.SecretString;
        else
          throw new Error(`Discovery secret ${v2} did not have string content`);

        cl.secretValue = JSON.parse(v2);
      } else cl.secretValue = undefined;

      cl.lastSuccessfulAttempt = new Date();

      return true;
    } catch (e) {
      this.logger.error(
        e,
        `Performing CloudMap discovery in ${cl.serviceName}`
      );
    }

    return false;
  }
}
