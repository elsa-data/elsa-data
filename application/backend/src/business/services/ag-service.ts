import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import e, { storage } from "../../../dbschema/edgeql-js";
import { inject, injectable, singleton } from "tsyringe";
import {
  S3ObjectMetadata,
  awsListObjects,
  readObjectToStringFromS3Key,
} from "./aws-helper";
import {
  File,
  insertArtifactFastqPairQuery,
  insertArtifactBamQuery,
  insertArtifactVcfQuery,
  insertArtifactCramQuery,
} from "../db/lab-queries";
import {
  makeEmptyIdentifierArray,
  makeSystemlessIdentifierArray,
  getMd5FromChecksumsArray,
} from "../db/helper";

// need to be configuration eventually
const BUCKET = "elsa-data-tmp";
const REGION = "ap-southeast-2";
const AG_BUCKET = "agha-gdr-store-2.0";

type manifestType = {
  checksum: string;
  filename: string;
  agha_study_id: string;
};

/**
 * Problem to note:
 * - What if manifest removed? nothing triggered on re-sync as manifest key does not exist
 */

@injectable()
@singleton()
export class AGService {
  constructor(
    @inject("S3Client") private s3Client: S3Client,
    @inject("Database") private edgeDbClient: edgedb.Client
  ) {}

  async getS3ObjectListFromKeyPrefix(s3KeyPrefix: string) {
    return await awsListObjects(this.s3Client, AG_BUCKET, s3KeyPrefix);
  }

  getManifestKeyFromS3ObjectList(s3ListMetadata: S3ObjectMetadata[]): string[] {
    const manifestKeys: string[] = [];
    for (const s3Metadata of s3ListMetadata) {
      if (s3Metadata.key.endsWith("manifest.txt")) {
        manifestKeys.push(s3Metadata.key);
      }
    }

    return manifestKeys;
  }

  convertTsvToJson(tsvString: string): unknown[] {
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

  /**
   * To group manifest object list based on study Id
   * @param manifestContentList Manifest Type list
   * @returns An object where key is studyId and value is a list of manifest type
   */
  groupManifestByStudyId(
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

  groupManifestFileByArtifactTypeAndFilename(
    fileRecordListedInManifest: File[]
  ): Record<string, Record<string, File[]>> {
    const groupFiletype: Record<string, Record<string, File[]>> = {};

    function addOrCreateNewArtifactGroup(
      artifactType: string,
      filenameId: string,
      manifestObj: File
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

    for (const manifestObj of fileRecordListedInManifest) {
      // Removing compressed extension for pairing purposes
      const lastSlashIndex = manifestObj.url.lastIndexOf("/") + 1;
      const filename = manifestObj.url
        .substring(lastSlashIndex)
        .replace(/.gz$/, "");

      // FASTQ Artifact
      if (filename.endsWith("fastq") || filename.endsWith("fq")) {
        const lastIndexOfUnderScore = filename.lastIndexOf("_");
        const filenameId = filename.substring(0, lastIndexOfUnderScore);
        addOrCreateNewArtifactGroup("artifactFastq", filenameId, manifestObj);

        // BAM Artifact
      } else if (filename.endsWith("bam") || filename.endsWith("bai")) {
        const firstIndexOfDot = filename.indexOf(".");
        const filenameId = filename.substring(0, firstIndexOfDot);
        addOrCreateNewArtifactGroup("artifactBam", filenameId, manifestObj);

        // VCF Artifact
      } else if (filename.endsWith("vcf") || filename.endsWith("tbi")) {
        const firstIndexOfDot = filename.indexOf(".");
        const filenameId = filename.substring(0, firstIndexOfDot);
        addOrCreateNewArtifactGroup("artifactVcf", filenameId, manifestObj);

        // CRAM Artifact
      } else if (filename.endsWith("cram") || filename.endsWith("crai")) {
        const firstIndexOfDot = filename.indexOf(".");
        const filenameId = filename.substring(0, firstIndexOfDot);
        addOrCreateNewArtifactGroup("artifactCram", filenameId, manifestObj);
      }
    }
    return groupFiletype;
  }

  async checkDbDifferenceFromManifest(
    s3UrlPrefix: string,
    manifestObjList: manifestType[]
  ): Promise<Record<string, manifestType[]>> {
    const result: Record<string, manifestType[]> = {
      missing: [],
      diff: [],
    };
    const trimSlashS3uriPrefix = s3UrlPrefix.replace(/\/$/, "");

    for (const manifestObj of manifestObjList) {
      const filenameS3Uri = `${trimSlashS3uriPrefix}/${manifestObj.filename}`;

      const queryFilename = e.select(e.storage.File, (file) => ({
        url: true,
        checksums: true,
        filter: e.op(file.url, "ilike", `${filenameS3Uri}`),
      }));

      const queryResult = await queryFilename.run(this.edgeDbClient);

      if (queryResult.length) {
        // It should only contain one value so index 0 should be it
        // (The query is `ilike` which only match with one value)
        const md5Recorded = getMd5FromChecksumsArray(queryResult[0].checksums);
        if (md5Recorded !== manifestObj.checksum) {
          result.diff.push(manifestObj);
        }
      } else {
        result.missing.push(manifestObj);
      }
    }
    return result;
  }

  /**
   * Update current db to updated version
   * @param s3UrlPrefix A prefix of the file
   * @param manifestRecord The updated manifest file
   */
  async updateFileRecordFromManifest(
    s3UrlPrefix: string,
    manifestRecord: manifestType
  ) {
    const s3Url = `${s3UrlPrefix}${manifestRecord.filename}`;

    const updateQuery = e.update(e.storage.File, (file) => ({
      filter: e.op(file.url, "ilike", s3Url),
      set: {
        // NOTE: it will replace the entire checksum field
        checksums: [
          {
            type: storage.ChecksumType.MD5,
            value: manifestRecord.checksum,
          },
        ],
      },
    }));
    await updateQuery.run(this.edgeDbClient);
  }

  /**
   * Inserting new artifacts to records
   * @param artifactTypeRecord A File grouped of artifact type and studyId . E.g. {artifactFastq : { A00001 : [File1, File2] } }
   * @returns
   */
  async insertNewArtifact(
    artifactTypeRecord: Record<string, Record<string, File[]>>
  ) {
    /**
     * Sorting url function to identify which is forward/reversed/indexed file
     * Index 0 is Forward file or base file
     * Index 1 if Reverse file or index file
     */
    const sortFileRec = (fileSet: File[]) =>
      fileSet.sort((a, b) =>
        a.url.toLowerCase() > b.url.toLowerCase() ? 1 : -1
      );

    // Inserting Fastq as lab output
    let r1: any;
    const fastqArtifact = artifactTypeRecord["artifactFastq"];
    if (fastqArtifact) {
      const fastqInsertQuery: any[] = [];

      for (const filenameId in fastqArtifact) {
        const fileSet = sortFileRec(fastqArtifact[filenameId]);
        const insertQuery = insertArtifactFastqPairQuery(
          fileSet[0],
          fileSet[1]
        );

        fastqInsertQuery.push(insertQuery);
      }
      r1 = await e
        .insert(e.lab.Run, {
          artifactsProduced: e.set(...fastqInsertQuery),
        })
        .run(this.edgeDbClient);
    }
    const r1select = e.select(e.lab.Run.artifactsProduced, (ab) => ({
      filter: e.op(
        e.uuid(r1.id),
        "=",
        ab["<artifactsProduced[is lab::Run]"].id
      ),
    }));

    // Analyses output
    const analysesOutputArtifactQuery: any[] = [];

    const artifactBam = artifactTypeRecord["artifactBam"];
    if (artifactBam) {
      for (const filenameId in artifactBam) {
        const fileSet = sortFileRec(artifactBam[filenameId]);
        analysesOutputArtifactQuery.push(
          insertArtifactBamQuery(fileSet[0], fileSet[1])
        );
      }
    }

    const artifactCram = artifactTypeRecord["artifactCram"];
    if (artifactCram) {
      for (const filenameId in artifactCram) {
        const fileSet = sortFileRec(artifactCram[filenameId]);
        analysesOutputArtifactQuery.push(
          insertArtifactCramQuery(fileSet[0], fileSet[1])
        );
      }
    }

    const artifactVcf = artifactTypeRecord["artifactVcf"];
    if (artifactVcf) {
      for (const filenameId in artifactVcf) {
        const fileSet = sortFileRec(artifactVcf[filenameId]);
        analysesOutputArtifactQuery.push(
          insertArtifactVcfQuery(fileSet[0], fileSet[1])
        );
      }
    }

    const a1 = await e
      .insert(e.lab.Analyses, {
        pipeline: "New pipeline",
        input: r1select,
        output: e.set(...analysesOutputArtifactQuery),
      })
      .run(this.edgeDbClient);

    const a1select = e.select(e.lab.Analyses.output, (ab) => ({
      filter: e.op(e.uuid(a1.id), "=", ab["<output[is lab::Analyses]"].id),
    }));

    return e.op(r1select, "union", a1select);
  }
  /**
   * Convert manifest record to a File record as file Db is stored as file record.
   * @param s3UriSubmissionPrefix
   * @param manifestRecordList A list of manifestType record
   * @param s3MetadataList An S3ObjectMetadata list for the particular manifest. (This will populate the size value)
   * @returns
   */
  convertManifestTypeToFileRecord(
    s3UriSubmissionPrefix: string,
    manifestRecordList: manifestType[],
    s3MetadataList: S3ObjectMetadata[]
  ): File[] {
    const result: File[] = [];

    const s3MetadataDict: Record<string, S3ObjectMetadata> = {};
    for (const s3Metadata of s3MetadataList) {
      const s3uri = `s3://${AG_BUCKET}/${s3Metadata.key}`;
      s3MetadataDict[s3uri] = s3Metadata;
    }
    const trimSlashS3uriPrefix = s3UriSubmissionPrefix.replace(/\/$/, "");
    // TODO: If undefined/list not found
    // print something saying file in manifest not found in the s3 list
    for (const manifestRecord of manifestRecordList) {
      const s3Uri = `${trimSlashS3uriPrefix}/${manifestRecord.filename}`;
      const fileSize = s3MetadataDict[s3Uri].size;

      if (!fileSize) {
        console.log(`No File foiund (${s3Uri})`);
      }
      result.push({
        url: s3Uri,
        size: fileSize,
        checksums: [
          {
            type: storage.ChecksumType.MD5,
            value: manifestRecord.checksum,
          },
        ],
      });
    }

    return result;
  }
  insertDatasetCase(studyId: string, artifacts: any) {
    const queryInsertDatasetCase = e.insert(e.dataset.DatasetCase, {
      externalIdentifiers: makeEmptyIdentifierArray(),
      patients: e.insert(e.dataset.DatasetPatient, {
        externalIdentifiers: makeSystemlessIdentifierArray(studyId),
        specimens: e.set(
          e.insert(e.dataset.DatasetSpecimen, {
            externalIdentifiers: makeEmptyIdentifierArray(),
            artifacts: artifacts,
          })
        ),
      }),
    });
    return queryInsertDatasetCase;
  }

  /**
   *
   * @param datasetCases A query of dataset case to be linked to dataset
   */
  async insertDataset(datasetCases: any) {
    // A more dynamic datasetUri and FlagShip are expected here
    const datasetUri =
      "urn:fdc:australiangenomics.org.au:2022:datasets/cardiac";
    const someFlaghsip = "CARDIAC";

    try {
      const queryInsertDataset = e.insert(e.dataset.Dataset, {
        uri: datasetUri,
        description: "Australian Genomics cardiac flagship",
        externalIdentifiers: makeSystemlessIdentifierArray(someFlaghsip),
        cases: e.set(datasetCases),
      });
      await queryInsertDataset.run(this.edgeDbClient);

      console.log("UPDATE");
    } catch (error) {
      const queryUpdateDataset = e.update(e.dataset.Dataset, (dataset) => ({
        filter: e.op(dataset.uri, "ilike", datasetUri),
        set: {
          cases: { "+=": datasetCases },
        },
      }));
      await queryUpdateDataset.run(this.edgeDbClient);
      console.log("INSERT");
    }
  }

  // Should be controller or main()
  async syncDbFromS3KeyPrefix(s3KeyPrefix: string) {
    // Searching match prefix with data in store bucket
    const s3MetadataList = await this.getS3ObjectListFromKeyPrefix(s3KeyPrefix);
    const manifestKeyList = this.getManifestKeyFromS3ObjectList(s3MetadataList);

    for (const manifestS3Key of manifestKeyList) {
      const manifestLastSlashIndex = manifestS3Key.lastIndexOf("/");
      const manifestS3Prefix = manifestS3Key.substring(
        0,
        manifestLastSlashIndex
      );
      const s3UrlPrefix = `s3://${AG_BUCKET}/${manifestS3Prefix}/`;

      const manifestTsvContent = await readObjectToStringFromS3Key(
        this.s3Client,
        AG_BUCKET,
        manifestS3Key
      );

      const manifestObjContentList = <manifestType[]>(
        this.convertTsvToJson(manifestTsvContent)
      );

      const comparedRecords = await this.checkDbDifferenceFromManifest(
        s3UrlPrefix,
        manifestObjContentList
      );

      if (comparedRecords.diff) {
        for (const rec of comparedRecords.diff) {
          await this.updateFileRecordFromManifest(s3UrlPrefix, rec);
        }
      }

      // Adding the missing record to db
      if (comparedRecords.missing) {
        const groupedRecByStudyId = this.groupManifestByStudyId(
          comparedRecords.missing
        );
        const listOfStudyId = Object.keys(groupedRecByStudyId);
        for (const studyId of listOfStudyId) {
          const manifestRecord = groupedRecByStudyId[studyId];

          // Convert to FILE record
          const fileRecordList = this.convertManifestTypeToFileRecord(
            manifestS3Prefix,
            manifestRecord,
            s3MetadataList
          );

          const groupArtifactType =
            this.groupManifestFileByArtifactTypeAndFilename(fileRecordList);

          // Insert Artifact
          const artifactsSpeciment = await this.insertNewArtifact(
            groupArtifactType
          );

          // Insert DatasetCase
          const dataset = this.insertDatasetCase(studyId, artifactsSpeciment);

          // Insert to FlagShip
          await this.insertDataset(dataset);
        }
      }
    }
  }
}
