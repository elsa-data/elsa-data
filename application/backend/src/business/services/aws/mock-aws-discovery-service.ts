import { inject, injectable } from "tsyringe";
import { AwsEnabledService } from "./aws-enabled-service";
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
import { IAwsDiscoveryService } from "./aws-discovery-service";

/**
 */
@injectable()
export class MockAwsDiscoveryService implements IAwsDiscoveryService {
  constructor(@inject("Logger") private readonly logger: Logger) {
    logger.debug(
      "Created MockAwsDiscoveryService instance - this will report back all services as discovered even though they don't exist"
    );
  }

  /**
   * Discover the ARN for the Copy Out steps function if it is present in our AWS
   * setup, or else return undefined. Caches the value.
   */
  public async locateCopyOutStepsArn(): Promise<string | undefined> {
    return "arn:steps";
  }

  /**
   * Discover the IAM user and secret key for Object Signing if it is present
   * in our AWS setup, or else return undefined. Caches the value.
   */
  public async locateObjectSigningPair(): Promise<
    [string, string] | undefined
  > {
    return ["abc", "def"];
  }

  /**
   * Discover the ARN for the Beacon lambda if it is present in our AWS
   * setup, or else return undefined. Caches the value.
   */
  public async locateBeaconLambdaArn(): Promise<string | undefined> {
    return "arn:lambda";
  }
}
