import { AuthenticatedUser } from "../authenticated-user";
import {
  collapseExternalIds,
  doRoleInReleaseCheck,
  getReleaseInfo,
} from "./helpers";
import * as edgedb from "edgedb";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import e from "../../../dbschema/edgeql-js";
import { UsersService } from "./users-service";
import { AuditLogService } from "./audit-log-service";

export type ReleaseAwsFileRecord = {
  caseId: string;
  patientId: string;
  specimenId: string;
  fileType: string;
  size: string;

  // currently only sourcing from AWS S3 but will need to think about this for others
  s3Url: string;
  s3Bucket: string;
  s3Key: string;

  // optional fields depending on what type of access asked for
  s3Signed?: string;

  // optional depending on what checksums have been entered
  md5?: string;
};

export abstract class AwsBaseService {
  private enabled: boolean;

  protected constructor(
    protected readonly edgeDbClient: edgedb.Client,
    protected readonly usersService: UsersService,
    protected readonly auditLogService: AuditLogService
  ) {
    // until we get proof our AWS commands have succeeded we assume AWS functionality is not available
    this.enabled = false;

    const stsClient = new STSClient({});

    stsClient
      .send(new GetCallerIdentityCommand({}))
      .then((result) => {
        this.enabled = true;
      })
      .catch((err) => {});
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  protected enabledGuard() {
    if (!this.enabled)
      throw new Error(
        "This service is not enabled due to lack of AWS credentials"
      );
  }

  /**
   * Retrieve a list of file objects that are available to the given user
   * for the given release. This function returns *only* raw data from the
   * database - it does not attempt to 'sign urls' etc.
   *
   * @param user
   * @param releaseId
   * @protected
   */
  protected async getAllFileRecords(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<ReleaseAwsFileRecord[]> {
    this.enabledGuard();

    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    const { releaseInfoQuery, releaseInfo } = await getReleaseInfo(
      this.edgeDbClient,
      releaseId
    );

    const filesQuery = e.select(e.dataset.DatasetSpecimen, (rs) => ({
      externalIdentifiers: true,
      patient: {
        externalIdentifiers: true,
      },
      case_: {
        externalIdentifiers: true,
      },
      dataset: {
        externalIdentifiers: true,
      },
      artifacts: {
        ...e.is(e.lab.ArtifactBcl, {
          bclFile: { url: true, size: true, checksums: true },
        }),
        ...e.is(e.lab.ArtifactFastqPair, {
          forwardFile: { url: true, size: true, checksums: true },
          reverseFile: { url: true, size: true, checksums: true },
        }),
        ...e.is(e.lab.ArtifactBam, {
          bamFile: { url: true, size: true, checksums: true },
          baiFile: { url: true, size: true, checksums: true },
        }),
        ...e.is(e.lab.ArtifactCram, {
          cramFile: { url: true, size: true, checksums: true },
          craiFile: { url: true, size: true, checksums: true },
        }),
        ...e.is(e.lab.ArtifactVcf, {
          vcfFile: { url: true, size: true, checksums: true },
          tbiFile: { url: true, size: true, checksums: true },
        }),
      },
      filter: e.op(rs, "in", releaseInfoQuery.selectedSpecimens),
    }));

    const getMd5 = (checksums: any[]): string => {
      for (const c of checksums || []) {
        if (c.type === "MD5") return c.value;
      }
      return "NONE";
    };

    const rows: ReleaseAwsFileRecord[] = [];

    const specimensInFiles = await filesQuery.run(this.edgeDbClient);

    for (const sif of specimensInFiles) {
      const caseId = collapseExternalIds(sif.case_?.externalIdentifiers);
      const patientId = collapseExternalIds(sif.patient?.externalIdentifiers);
      const specimenId = collapseExternalIds(sif.externalIdentifiers);

      for (const fa of sif.artifacts) {
        const result: Partial<ReleaseAwsFileRecord> = {
          caseId: caseId,
          patientId: patientId,
          specimenId: specimenId,
          size: "-1",
        };

        // note that we are processing here every artifact that is accessible from
        // the chosen specimens
        // below we apply some simple logic that will rule out classes of artifacts
        // based on the isAllowedReadData, isAllowedVariantData etc

        if (fa.forwardFile) {
          if (!releaseInfo.isAllowedReadData) continue;
          result.fileType = "FASTQ";
          result.s3Url = fa.forwardFile.url;
          result.size = fa.forwardFile.size.toString();
          result.md5 = getMd5(fa.forwardFile.checksums);
        } else if (fa.reverseFile) {
          if (!releaseInfo.isAllowedReadData) continue;
          result.fileType = "FASTQ";
          result.s3Url = fa.reverseFile.url;
          result.size = fa.reverseFile.size.toString();
          result.md5 = getMd5(fa.reverseFile.checksums);
        } else if (fa.bamFile) {
          if (!releaseInfo.isAllowedReadData) continue;
          result.fileType = "BAM";
          result.s3Url = fa.bamFile.url;
          result.size = fa.bamFile.size.toString();
          result.md5 = getMd5(fa.bamFile.checksums);
        } else if (fa.baiFile) {
          if (!releaseInfo.isAllowedReadData) continue;
          result.fileType = "BAM";
          result.s3Url = fa.baiFile.url;
          result.size = fa.baiFile.size.toString();
          result.md5 = getMd5(fa.baiFile.checksums);
        } else if (fa.cramFile) {
          if (!releaseInfo.isAllowedReadData) continue;
          result.fileType = "CRAM";
          result.s3Url = fa.cramFile.url;
          result.size = fa.cramFile.size.toString();
          result.md5 = getMd5(fa.cramFile.checksums);
        } else if (fa.craiFile) {
          if (!releaseInfo.isAllowedReadData) continue;
          result.fileType = "CRAM";
          result.s3Url = fa.craiFile.url;
          result.size = fa.craiFile.size.toString();
          result.md5 = getMd5(fa.craiFile.checksums);
        } else if (fa.vcfFile) {
          if (!releaseInfo.isAllowedVariantData) continue;
          result.fileType = "VCF";
          result.s3Url = fa.vcfFile.url;
          result.size = fa.vcfFile.size.toString();
          result.md5 = getMd5(fa.vcfFile.checksums);
        } else if (fa.tbiFile) {
          if (!releaseInfo.isAllowedVariantData) continue;
          result.fileType = "VCF";
          result.s3Url = fa.tbiFile.url;
          result.size = fa.tbiFile.size.toString();
          result.md5 = getMd5(fa.tbiFile.checksums);
        } else {
          continue;
        }

        // decompose the S3 url into bucket and key
        const _match = result.s3Url.match(/^s3?:\/\/([^\/]+)\/?(.*?)$/);

        if (!_match) {
          // TODO: whilst out test data is not actually in AWS we have a bunch of dud URLS - we fix rather than error
          result.s3Url = "s3://bucket/key";
          result.s3Bucket = "bucket";
          result.s3Key = "key";
          // throw new Error("Bad S3 URL format");
          continue;
        } else {
          result.s3Bucket = _match[1];
          result.s3Key = _match[2];
        }

        rows.push(result as ReleaseAwsFileRecord);
      }
    }

    return rows;
  }
}
