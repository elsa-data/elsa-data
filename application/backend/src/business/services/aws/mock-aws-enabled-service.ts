import { inject, injectable } from "tsyringe";
import { AwsEnabledService, IAwsEnabledService } from "./aws-enabled-service";
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

/**
 */
@injectable()
export class MockAwsEnabledService implements IAwsEnabledService {
  constructor(@inject("Logger") private readonly logger: Logger) {
    logger.debug(
      "Created MockAwsDiscoveryService instance - this will report back all services as discovered even though they don't exist"
    );
  }

  public async isEnabled(): Promise<boolean> {
    return true;
  }

  public async enabledGuard(): Promise<void> {
    return;
  }
}
