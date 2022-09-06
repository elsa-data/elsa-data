import {
  ListObjectsV2Command,
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { inject, injectable, singleton } from "tsyringe";
import { UsersService } from "./users-service";
import { has } from "lodash";
import { AuditLogService } from "./audit-log-service";
import path from "path";

// need to be configuration eventually
const BUCKET = "elsa-data-tmp";
const REGION = "ap-southeast-2";
const AG_BUCKET = "agha-gdr-store-2.0";

interface manifestType {
  checksum: string;
  filename: string;
  agha_study_id: string;
}

@injectable()
@singleton()
export class AGService {
  constructor(
    @inject("S3Client") private s3Client: S3Client,
    @inject("Database") edgeDbClient: edgedb.Client
  ) {}

  async getManifestListFromS3KeyPrefix(
    s3KeyPrefix: string
  ): Promise<Record<string, string | number | undefined>[]> {
    let manifestKeyList: Record<string, string | number | undefined>[] = [];
    let continuationToken: string | undefined = undefined;

    do {
      try {
        const s3ClientInput: ListObjectsV2Command = new ListObjectsV2Command({
          Bucket: AG_BUCKET,
          Prefix: s3KeyPrefix,
          ContinuationToken: continuationToken,
        });
        const listObjOutput = await this.s3Client.send(s3ClientInput);

        continuationToken = listObjOutput.NextContinuationToken;
        const listContent = listObjOutput.Contents;

        if (listContent) {
          for (const objContent of listContent) {
            const key = objContent.Key;

            // Only interested in manifest file
            if (key?.endsWith("manifest.txt")) {
              manifestKeyList.push({
                ETag: objContent.ETag,
                Key: objContent.Key,
                Size: objContent.Size,
              });
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    } while (continuationToken);

    return manifestKeyList;
  }

  async readFileFromS3Key(manifestKey: string): Promise<string | undefined> {
    try {
      const s3ClientInput: GetObjectCommand = new GetObjectCommand({
        Bucket: AG_BUCKET,
        Key: manifestKey,
      });
      const getObjOutput = await this.s3Client.send(s3ClientInput);
      const bodyBuffer = await getObjOutput.Body.toArray();

      return bodyBuffer.toString("utf-8");
    } catch (e) {
      console.error(e);
    }
  }

  convertTsvToJson(tsvString: string): Record<string, string>[] {
    tsvString = tsvString.trimEnd();

    const lines = tsvString.split("\n");
    const result = [];
    const headers = lines[0].split("\t");

    for (let i = 1; i < lines.length; i++) {
      const obj: Record<string, string> = {};
      const currentline = lines[i].split("\t");

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }

      result.push(obj);
    }

    return result;
  }

  groupManifestTypeByStudyId(
    manifestContentList: manifestType[]
  ): Record<string, manifestType[]> {
    const studyIdGroup: Record<string, manifestType[]> = {};
    for (const manifestObject of manifestContentList) {
      const studyId = manifestObject.agha_study_id;

      if (studyIdGroup[studyId] && Array.isArray(studyIdGroup[studyId])) {
        studyIdGroup[studyId].push(manifestObject);
      } else {
        studyIdGroup[studyId] = [manifestObject];
      }
    }
    return studyIdGroup;
  }

  groupManifestFileByArtifactType(
    manifestContentList: manifestType[]
  ): Record<string, Record<string, manifestType[]>> {
    const groupFiletype: Record<string, Record<string, manifestType[]>> = {};

    function addOrCreateNewArtifactGroup(
      artifactType: string,
      filenameId: string,
      manifestObj: manifestType
    ) {
      if (!groupFiletype[artifactType]) {
        groupFiletype[artifactType] = {};
      }
      if (groupFiletype[artifactType][filenameId]) {
        groupFiletype[artifactType][filenameId].push(manifestObj);
      } else {
        groupFiletype[artifactType][filenameId] = [manifestObj];
      }
    }

    for (const manifestObj of manifestContentList) {
      // Removing compressed extention for pairing purposes
      const filename = manifestObj.filename.replace(/.gz$/, "");

      // FASTQ Artifact
      if (filename.endsWith("fastq") || filename.endsWith("fq")) {
        const lastIndexOfUnderScore = filename.lastIndexOf("_");
        const filenameId = filename.substring(0, lastIndexOfUnderScore);
        addOrCreateNewArtifactGroup("artifactFastq", filenameId, manifestObj);

        // BAM Artifact
      } else if (filename.endsWith("bam") || filename.endsWith("bai")) {
        const filenameId = path.parse(filename).name;
        addOrCreateNewArtifactGroup("artifactBam", filenameId, manifestObj);

        // VCF Artifact
      } else if (filename.endsWith("vcf") || filename.endsWith("tbi")) {
        const filenameId = path.parse(filename).name;
        addOrCreateNewArtifactGroup("artifactVcf", filenameId, manifestObj);

        // CRAM Artifact
      } else if (filename.endsWith("cram") || filename.endsWith("crai")) {
        const filenameId = path.parse(filename).name;
        addOrCreateNewArtifactGroup("artifactCram", filenameId, manifestObj);
      }
    }
    return groupFiletype;
  }
}
