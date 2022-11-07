import { AuthenticatedUser } from "../authenticated-user";
import * as edgedb from "edgedb";
import { inject, injectable, singleton } from "tsyringe";
import { UsersService } from "./users-service";
import { AwsBaseService } from "./aws-base-service";
import { AuditLogService } from "./audit-log-service";

import { ElsaSettings } from "../../config/elsa-settings";

@injectable()
@singleton()
export class AwsCloudTrailLakeService extends AwsBaseService {
  constructor(
    @inject("Database") protected edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings,
    usersService: UsersService,
    auditLogService: AuditLogService
  ) {
    super(edgeDbClient, usersService, auditLogService);
  }

  async getCloudTrailLakeEvents(): Promise<Record<string, any>[]> {
    // Do some querying shown in ../../../cloudTrail S3 stack
    // Presigned URL will only live for 7 days, so it might be appropriate to query data 7 days from the release data in the audit log
    // Limiting/filtering cloudtrail lake span will save $$ as it charge per data scan.
    // For now data is as below.
    return [
      {
        releaseId: "abcd-efgh-ijkl-mnop",
        eventTime: "2022-01-01 05:56:40.000",
        sourceIPAddress: "123.123.123.123",
        bucketName: "agha-gdr-elsa-2.0",
        key: "Elsa/20220202/ELSA001.vcf.gz.tbi",
        bytesTransferredOut: 75,
      },
      {
        releaseId: "abcd-efgh-ijkl-mnop",
        eventTime: "2022-01-01 05:51:29.000",
        sourceIPAddress: "123.123.123.123",
        bucketName: "agha-gdr-store-2.0",
        key: "Elsa/20220202/ELS001.bam.bai",
        bytesTransferredOut: 25,
      },
      {
        releaseId: "abcd-efgh-ijkl-mnop",
        eventTime: "2022-01-01 05:56:43.000",
        sourceIPAddress: "123.123.123.123",
        bucketName: "agha-gdr-store-2.0",
        key: "Elsa/20220202/ELS002.vcf.gz",
        bytesTransferredOut: 100,
      },
      {
        releaseId: "abcd-efgh-ijkl-mnop",
        eventTime: "2022-01-01 05:51:30.000",
        sourceIPAddress: "123.123.123.123",
        bucketName: "agha-gdr-store-2.0",
        key: "Elsa/20220202/ELS002.vcf.gz.tbi",
        bytesTransferredOut: 50,
      },
    ];
  }

  // Ideally might be an interval job (perhaps run weekly? or maybe 7days after releaseAudit)
  // Initial phase it would run on demand from a button
  async recordCloudTrailLogByReleaseId({
    releaseAuditEventId,
  }: {
    releaseAuditEventId: string;
  }) {
    const cloudTrailEventArray = await this.getCloudTrailLakeEvents();

    // Recording this into database
    // Make idempotent, perhaps don't trigger if it has run.
    // Make sure with edgedb current time is : timezone in UTC time? or local ec2 region

    for (const trailEvent of cloudTrailEventArray) {
      const s3Url = `s3://${trailEvent.bucketName}/${trailEvent.key}`;
      const utcDate = new Date(`${trailEvent.eventTime} UTC`);

      // Improvement do it in batch?
      await this.auditLogService.updateDataAccessAuditEvent({
        executor: this.edgeDbClient,
        releaseAuditEventId: releaseAuditEventId,
        who: trailEvent.sourceIPAddress,
        fileUrl: s3Url,
        description: "Presigned URL accessed.",
        egressBytes: trailEvent.bytesTransferredOut,
        date: utcDate,
      });
    }
  }
}
