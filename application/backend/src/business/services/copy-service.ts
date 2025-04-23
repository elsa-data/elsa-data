import * as gel from "gel";
import { inject, injectable } from "tsyringe";
import type { ElsaSettings } from "../../config/elsa-settings";
import { AwsDiscoveryService } from "./aws/aws-discovery-service";
import { paginateListExecutions, SFNClient } from "@aws-sdk/client-sfn";

export type Copied = {
  id: string;
  status: string;
};

@injectable()
export class CopyService {
  constructor(
    @inject("Database") private readonly gelClient: gel.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("SFNClient") private readonly sfnClient: SFNClient,
    @inject(AwsDiscoveryService)
    private readonly awsDiscoveryService: AwsDiscoveryService,
  ) {}

  public async getCopied() {
    const stateMachineArn =
      await this.awsDiscoveryService.locateCopyServiceStepsArn();

    if (!stateMachineArn) {
      return [];
    }

    const results: Copied[] = [];

    for await (const page of paginateListExecutions(
      { client: this.sfnClient },
      { stateMachineArn: stateMachineArn, redriveFilter: "NOT_REDRIVEN" },
    )) {
      for (const e of page.executions || []) {
        results.push({
          id: e.name!,
          status: e.status?.toString() ?? "UNDEFINED",
        });
      }
    }

    return results;
  }

  public async getCopiedReport(copiedId: string) {
    return {
      name: "asdasd",
    };
  }
}
