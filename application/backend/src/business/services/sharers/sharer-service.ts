import * as edgedb from "edgedb";
import { inject, injectable } from "tsyringe";
import { ElsaSettings } from "../../../config/elsa-settings";
import { AuditEventService } from "../audit-event-service";
import { SharerType } from "../../../config/config-schema-sharer";
import { AwsDiscoveryService } from "../aws/aws-discovery-service";
import { AwsEnabledService } from "../aws/aws-enabled-service";

export type SharerWithStatusType = SharerType & {
  notWorkingReason?: string;
};

@injectable()
export class SharerService {
  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject(AwsEnabledService)
    private readonly awsEnabledService: AwsEnabledService,
    @inject(AwsDiscoveryService)
    private readonly awsDiscoveryService: AwsDiscoveryService,
    @inject(AuditEventService)
    private readonly auditLogService: AuditEventService,
  ) {}

  /**
   * For a given configured sharer - do checks on how well it is functioning
   * in the actually deployed environment - and if needed return a message
   * about the status.
   *
   * @param s
   * @private
   */
  private async checkSharerWorking(
    s: SharerType,
  ): Promise<SharerWithStatusType> {
    switch (s.type) {
      case "object-signing":
        return (await this.awsDiscoveryService.locateObjectSigningPair())
          ? s
          : {
              ...s,
              notWorkingReason: "Object Signing service not installed",
            };

      case "copy-out":
        return (await this.awsDiscoveryService.locateCopyOutStepsArn())
          ? s
          : {
              ...s,
              notWorkingReason: "Copy Out service not installed",
            };

      case "aws-access-point":
        if (!(await this.awsEnabledService.isEnabled()))
          return {
            ...s,
            notWorkingReason: "AWS not enabled in this deployment",
          };

        // check for whether we have been installed with permissions? (without the ability to install cloudformations
        // we can't do access points

        return s;

      case "htsget":
        // is there anything we can check?? service up??

        return s;
    }
  }
  /**
   * Return all the sharers configured for use AND an extra boolean indicating
   * if they are functional in the current setup.
   *
   * @returns
   */
  public async getSharersConfiguration(): Promise<SharerWithStatusType[]> {
    return await Promise.all(
      this.settings.sharers.map(async (i) => this.checkSharerWorking(i)),
    );
  }
}
