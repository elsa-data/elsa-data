import { AuthenticatedUser } from "../authenticated-user";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  collapseExternalIds,
  doRoleInReleaseCheck,
  getReleaseInfo,
} from "./helpers";
import * as edgedb from "edgedb";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import e from "../../../dbschema/edgeql-js";
import { Client } from "edgedb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { inject, injectable, singleton } from "tsyringe";
import { UsersService } from "./users-service";

export type ReleaseAwsFileRecord = {
  caseId: string;
  patientId: string;
  specimenId: string;
  fileType: string;
  size: string;
  s3: string;
  s3Signed: string;
  md5: string;
};

@injectable()
@singleton()
export class AwsService {
  private enabled: boolean;

  constructor(
    @inject("Database") private readonly edgeDbClient: Client,
    private readonly usersService: UsersService
  ) {
    // until we get proof our AWS commands have succeeded we assume this functionality is not available
    this.enabled = false;

    try {
      const stsClient = new STSClient({});

      stsClient.send(new GetCallerIdentityCommand({})).then((result) => {
        this.enabled = true;
      });
    } catch (e) {}
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  public async getPresigned(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<ReleaseAwsFileRecord[] | null> {
    if (!this.enabled)
      throw new Error(
        "This service is not enabled due to lack of AWS credentials"
      );

    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    const { releaseInfoQuery } = await getReleaseInfo(
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
        ...e.is(e.lab.ArtifactFastqPair, {
          forwardFile: { url: true, size: true, checksums: true },
          reverseFile: { url: true, size: true, checksums: true },
        }),
        ...e.is(e.lab.ArtifactBam, {
          bamFile: { url: true, size: true, checksums: true },
          baiFile: { url: true, size: true, checksums: true },
        }),
        ...e.is(e.lab.ArtifactVcf, {
          vcfFile: { url: true, size: true, checksums: true },
          tbiFile: { url: true, size: true, checksums: true },
        }),
      },
      filter: e.op(rs, "in", releaseInfoQuery.selectedSpecimens),
    }));

    const specimensInFiles = await filesQuery.run(this.edgeDbClient);

    const rows: ReleaseAwsFileRecord[] = [];

    const s3Client = new S3Client({});

    const presign = async (s3url: string) => {
      const _match = s3url.match(/^s3?:\/\/([^\/]+)\/?(.*?)$/);
      if (!_match) throw new Error("Bad format");
      const command = new GetObjectCommand({
        Bucket: _match[1],
        Key: _match[2],
      });
      return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    };

    const getMd5 = (checksums: any[]): string => {
      for (const c of checksums || []) {
        if (c.type === "MD5") return c.value;
      }
      return "NONE";
    };

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

        if (fa.forwardFile) {
          result.fileType = "FASTQ";
          result.s3 = fa.forwardFile.url;
          result.size = fa.forwardFile.size.toString();
          result.md5 = getMd5(fa.forwardFile.checksums);
        } else if (fa.reverseFile) {
          result.fileType = "FASTQ";
          result.s3 = fa.reverseFile.url;
          result.size = fa.reverseFile.size.toString();
          result.md5 = getMd5(fa.reverseFile.checksums);
        } else if (fa.bamFile) {
          result.fileType = "BAM";
          result.s3 = fa.bamFile.url;
          result.size = fa.bamFile.size.toString();
          result.md5 = getMd5(fa.bamFile.checksums);
        } else {
          continue;
        }

        result.s3Signed = await presign(result.s3);

        rows.push(result as ReleaseAwsFileRecord);
      }
    }

    return rows;
  }
}
