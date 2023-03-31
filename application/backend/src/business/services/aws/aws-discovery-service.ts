import { inject, injectable, singleton } from "tsyringe";
import { AwsEnabledService } from "./aws-enabled-service";
import { ElsaSettings } from "../../../config/elsa-settings";
import { Logger } from "pino";
import {
  DiscoverInstancesCommand,
  ServiceDiscoveryClient,
} from "@aws-sdk/client-servicediscovery";

/**
 * The discovery service will be a common pattern for how Elsa discovers
 * other microservices dynamically - as the platform/stack outgrows a single
 * repo this will become increasingly important.
 *
 * This is currently a very simple AWS focussed version, to be refactored
 * once other deployment environments exist.
 */
@injectable()
@singleton()
export class AwsDiscoveryService {
  constructor(
    @inject("ServiceDiscoveryClient")
    private readonly serviceDiscoveryClient: ServiceDiscoveryClient,
    @inject("Logger") private readonly logger: Logger,
    @inject("Settings") private readonly settings: ElsaSettings,
    private readonly awsEnabledService: AwsEnabledService
  ) {
    logger.debug(
      "Created AwsDiscoveryService instance - expecting this to only happen once"
    );
  }

  private copyOutStepsRunSuccessfully = false;
  private copyOutStepsArn: string | null = null;

  /**
   * Discover the ARN for the Copy Out steps function if it is present in our AWS
   * setup, or else return null. Aggressively caches the value.
   */
  public async locateCopyOutStepsArn(): Promise<string | null> {
    await this.awsEnabledService.enabledGuard();

    if (!this.copyOutStepsRunSuccessfully) {
      const key = "stateMachineArn";
      const service = "ElsaDataCopyOut";

      const command = new DiscoverInstancesCommand({
        NamespaceName: this.settings.serviceDiscoveryNamespace,
        ServiceName: service,
      });

      // note unlike what the documentation implies - if the service is not present
      // this call just returns an empty set of instances - not an error
      const response = await this.serviceDiscoveryClient.send(command);

      this.copyOutStepsRunSuccessfully = true;

      for (const i of response.Instances || []) {
        if (i.Attributes && key in i.Attributes) {
          this.copyOutStepsArn = i.Attributes[key];
          // shouldn't be more than one - take the first anyhow
          break;
        }
      }
    }

    return this.copyOutStepsArn;
  }

  private beaconLambdaRunSuccessfully = false;
  private beaconLambdaArn: string | null = null;

  /**
   * Discover the ARN for the Beacon lambda if it is present in our AWS
   * setup, or else return null. Aggressively caches the value.
   */
  public async locateBeaconLambdaArn(): Promise<string | null> {
    await this.awsEnabledService.enabledGuard();

    if (!this.beaconLambdaRunSuccessfully) {
      const key = "lambdaArn";
      const service = "ElsaDataBeacon";

      const command = new DiscoverInstancesCommand({
        NamespaceName: this.settings.serviceDiscoveryNamespace,
        ServiceName: service,
      });

      // note unlike what the documentation implies - if the service is not present
      // this call just returns an empty set of instances - not an error
      const response = await this.serviceDiscoveryClient.send(command);

      this.beaconLambdaRunSuccessfully = true;

      for (const i of response.Instances || []) {
        if (i.Attributes && key in i.Attributes) {
          this.beaconLambdaArn = i.Attributes[key];
          // shouldn't be more than one - take the first anyhow
          break;
        }
      }
    }

    return this.beaconLambdaArn;
  }
}
