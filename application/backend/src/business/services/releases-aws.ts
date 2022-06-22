import { AuthenticatedUser } from "../authenticated-user";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { doRoleInReleaseCheck, getReleaseInfo } from "./releases-helper";
import * as edgedb from "edgedb";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import e from "../../../dbschema/edgeql-js";
import { Client } from "edgedb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

class ReleasesAwsService {
  private readonly edgeDbClient: Client;
  private enabled: boolean;

  constructor() {
    // until we get proof our AWS commands have succeeded we assume this functionality is not available
    this.enabled = false;

    try {
      const stsClient = new STSClient({});

      stsClient.send(new GetCallerIdentityCommand({})).then((result) => {
        this.enabled = true;
      });
    } catch (e) {}
    this.edgeDbClient = edgedb.createClient();
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  public async getPresigned(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<string[] | null> {
    if (!this.enabled)
      throw new Error(
        "This service is not enabled due to lack of AWS credentials"
      );

    const { userRole } = await doRoleInReleaseCheck(user, releaseId);

    const {
      releaseInfoQuery,
      selectedSpecimenIds,
      selectedSpecimenUuids,
      datasetUriToIdMap,
    } = await getReleaseInfo(this.edgeDbClient, releaseId);

    const filesQuery = e.select(e.dataset.DatasetSpecimen, (rs) => ({
      artifacts: {
        ...e.is(e.lab.ArtifactFastqPair, {
          forwardFile: { url: true },
          reverseFile: { url: true },
        }),
        ...e.is(e.lab.ArtifactBam, {
          bamFile: { url: true },
          baiFile: { url: true },
        }),
        ...e.is(e.lab.ArtifactVcf, {
          vcfFile: { url: true },
          tbiFile: { url: true },
        }),
      },
      filter: e.op(rs, "in", releaseInfoQuery.selectedSpecimens),
    }));

    const specimensInFiles = await filesQuery.run(this.edgeDbClient);

    const rows: string[] = [];

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

    for (const sif of specimensInFiles) {
      for (const fa of sif.artifacts) {
        if (fa.forwardFile) rows.push(await presign(fa.forwardFile.url));
        if (fa.reverseFile) rows.push(await presign(fa.reverseFile.url));
        if (fa.bamFile) rows.push(await presign(fa.bamFile.url));
      }
    }

    return rows;
  }
}

export const releasesAwsService = new ReleasesAwsService();
