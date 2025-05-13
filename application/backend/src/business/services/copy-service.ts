import { S3Client } from "@aws-sdk/client-s3";
import {
  DescribeExecutionCommand,
  ExecutionStatus,
  paginateListExecutions,
  SFNClient,
} from "@aws-sdk/client-sfn";
import * as gel from "gel";
import { LRUCache } from "lru-cache";
import { inject, injectable, singleton } from "tsyringe";
import {
  createPagedResult,
  PagedResult,
} from "../../api/helpers/pagination-helpers";
import type { ElsaSettings } from "../../config/elsa-settings";
import { CopyInvokeEntryType } from "../../shared/schemas-copier";
import { AwsDiscoveryService } from "./aws/aws-discovery-service";
import { getCopierMapRunManifestEntries } from "./copy-service-helpers";

export type Copied = {
  id: string;
  arn: string;
  status: string;
};

export type CopySummaryEntry = CopyInvokeEntryType;

export type CopySummaryHeader = {
  overallError?: string;
  timeTakenSeconds: number;
  totalBytesTransferred: number;
};

export type CopySummary = {
  header: CopySummaryHeader;
  entries: CopySummaryEntry[];
};

@injectable()
@singleton()
export class CopyService {
  private readonly cache: LRUCache<string, CopySummary>;

  constructor(
    @inject("Database") private readonly gelClient: gel.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("S3Client") private readonly s3Client: S3Client,
    @inject("SFNClient") private readonly sfnClient: SFNClient,
    @inject(AwsDiscoveryService)
    private readonly awsDiscoveryService: AwsDiscoveryService,
  ) {
    this.cache = new LRUCache<string, CopySummary>({
      max: 500,
      // how long to live in ms
      ttl: 1000 * 60 * 15,
    });
  }

  public async getCopied() {
    const stateMachineArn =
      await this.awsDiscoveryService.locateCopyServiceStepsArn();

    if (!stateMachineArn) {
      console.log("Could not find copy ARN");
      return [];
    }

    const results: Copied[] = [];

    for await (const page of paginateListExecutions(
      { client: this.sfnClient },
      {
        stateMachineArn: stateMachineArn,
      },
    )) {
      for (const e of page.executions || []) {
        // only want known good executions
        if (e.name!.length !== 16 || e.status !== ExecutionStatus.SUCCEEDED)
          continue;

        results.push({
          id: e.name!,
          arn: e.executionArn!,
          status: e.status?.toString() ?? "UNDEFINED",
        });
      }
    }

    return results;
  }

  public async getCopySummaryHeader(copiedExecutionArn: string) {
    const summary =
      await this.getCopySummaryFromExecutionWithCaching(copiedExecutionArn);

    return summary.header;
  }

  public async getCopySummaryRows(
    copiedExecutionArn: string,
    limit: number,
    offset: number,
  ): Promise<PagedResult<any>> {
    const summary =
      await this.getCopySummaryFromExecutionWithCaching(copiedExecutionArn);

    return createPagedResult(
      summary.entries.slice(offset, offset + limit),
      summary.entries.length,
    );
  }

  private async getCopySummaryFromExecutionWithCaching(
    copiedExecutionArn: string,
  ): Promise<CopySummary> {
    const x = this.cache.get(copiedExecutionArn, {
      updateAgeOnGet: true,
    });

    if (x) return x;

    const y = await this.getCopySummaryFromExecution(copiedExecutionArn);

    this.cache.set(copiedExecutionArn, y);

    return y;
  }

  /*
  {
    "bytes_transferred": 11671621,
    "check_stats": {
      "compared": [
        {
          "locations": [
            "/work/copy-batch",
            "/tmp/copy-batch"
          ],
          "reason": {
            "kind": "crc64nvme",
            "value": "e4a9115dfbcabae1"
          }
        }
      ],
      "comparison_type": "Equality",
      "elapsed_seconds": 0.001293792,
      "groups": [
        [
          "/tmp/copy-batch",
          "/work/copy-batch"
        ]
      ]
    },
    "copy_mode": "ServerSide",
    "destination": "file:///tmp/copy-batch",
    "elapsed_seconds": 0.149844584,
    "generate_stats": {
      "check_stats": {
        "comparison_type": "Comparability",
        "elapsed_seconds": 0.000084334,
        "groups": [
          [
            "/tmp/copy-batch"
          ],
          [
            "/work/copy-batch"
          ]
        ]
      },
      "elapsed_seconds": 0.122502083,
      "stats": [
        {
          "checksums_generated": [
            {
              "kind": "crc64nvme",
              "value": "e4a9115dfbcabae1"
            }
          ],
          "input": "/work/copy-batch",
          "updated": true
        },
        {
          "checksums_generated": [
            {
              "kind": "crc64nvme",
              "value": "e4a9115dfbcabae1"
            }
          ],
          "input": "/tmp/copy-batch",
          "updated": true
        }
      ]
    },
    "n_retries": 0,
    "reason": {
      "kind": "crc64nvme",
      "value": "e4a9115dfbcabae1"
    },
    "skipped": false,
    "source": "file:///work/copy-batch",
    "sums_mismatch": false
  }
   */

  /**
   * Look at the outputs of a steps orchestration and build an in-memory summary of the copy.
   * This steps is resource intensive and involves AWS calls - so should be cached if
   * possible.
   *
   * @param copiedExecutionArn
   * @private
   */
  private async getCopySummaryFromExecution(
    copiedExecutionArn: string,
  ): Promise<CopySummary> {
    // needs to be coordinated with the definition in the Steps copier
    // is an example output
    // {
    //     "type": "Large",
    //     "manifestKey": "a-working-folder/beb5bbd8b59f9c00/objects-to-copy.tsv/f7875ce4-a8d2-4afc-a52d-2131322eb233/manifest.json",
    //     "manifestBucket": "stepss3copy-working66f7dd3f-x4jwbnt6qvxc",
    //     "mapRunArn": "arn:aws:states:ap-southeast-2:843407916570:mapRun:StepsS3CopyStateMachine157A1409-jx4WNxpdckgQ/40effd22-8724-3d56-ab76-cff4f6ac3446:f7875ce4-a8d2-4afc-a52d-2131322eb233"
    //   }

    type StepsResultEntry = {
      type: string;
      manifestKey: string;
      manifestBucket: string;
      mapRunArn: string;
    };

    const describeExecutionResult = await this.sfnClient.send(
      new DescribeExecutionCommand({
        executionArn: copiedExecutionArn,
        includedData: "ALL_DATA",
      }),
    );

    if (describeExecutionResult.status === ExecutionStatus.SUCCEEDED) {
      const stepsResult: StepsResultEntry[] = JSON.parse(
        describeExecutionResult.output!,
      );

      // we expect our steps result to be an array of MapRun results
      // where results from all the runs need to be returned
      if (Array.isArray(stepsResult)) {
        const resultArray: CopySummaryEntry[] = [];

        for (const sr of stepsResult) {
          // TODO use the sr.type to distinguish the ways the files were copied
          // and use that to look at stats
          // for instance - get time taken for thaw from
          // thawing copier

          for await (const e of getCopierMapRunManifestEntries(
            this.s3Client,
            sr.manifestBucket,
            sr.manifestKey,
          )) {
            resultArray.push(e);
          }
        }

        let totalTransferred = 0;

        for (const stat of resultArray) {
          totalTransferred += stat.bytes_transferred;
        }

        return {
          header: {
            totalBytesTransferred: totalTransferred,
            timeTakenSeconds:
              (describeExecutionResult.stopDate!.getTime() -
                describeExecutionResult.startDate!.getTime()) /
              1000,
          },
          entries: resultArray,
        };
      } else {
        return {
          header: {
            overallError: "Result was not an array",
            timeTakenSeconds: 0,
            totalBytesTransferred: 0,
          },
          entries: [],
        };
      }
    }
    return {
      header: {
        overallError: describeExecutionResult.error!,
        timeTakenSeconds: 0,
        totalBytesTransferred: 0,
      },
      entries: [],
    };
  }
}
