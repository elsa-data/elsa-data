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
  ArtifactType,
  insertArtifactFastqPairQuery,
  insertArtifactBamQuery,
  insertArtifactVcfQuery,
  insertArtifactCramQuery,
  ArtifactStudyIdAndFileIdByDatasetUriQueryType,
  fastqArtifactStudyIdAndFileIdByDatasetUriQuery,
  bamArtifactStudyIdAndFileIdByDatasetUriQuery,
  vcfArtifactStudyIdAndFileIdByDatasetUriQuery,
  cramArtifactStudyIdAndFileIdByDatasetUriQuery,
  fileByFileIdQuery,
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

/**
 * Manifest Type as what current AG manifest data will look like
 */
type manifestType = {
  checksum: string;
  agha_study_id: string;
  s3Url: string;
};
type manifestDict = Record<string, manifestType>;

@injectable()
@singleton()
export class AGService {
  constructor(
    @inject("S3Client") private s3Client: S3Client,
    @inject("Database") private edgeDbClient: edgedb.Client
  ) {}

  /**
   * @param s3KeyPrefix Prefix to search
   * @returns A list of S3 object metadata for AG bucket matching key prefix
   */
  async getS3ObjectListFromKeyPrefix(
    s3KeyPrefix: string
  ): Promise<S3ObjectMetadata[]> {
    return await awsListObjects(this.s3Client, AG_BUCKET, s3KeyPrefix);
  }

  /**
   * @param s3ListMetadata
   * @returns A list of manifest string
   */
  getManifestKeyFromS3ObjectList(s3ListMetadata: S3ObjectMetadata[]): string[] {
    const manifestKeys: string[] = [];
    for (const s3Metadata of s3ListMetadata) {
      if (s3Metadata.key.endsWith("manifest.txt")) {
        manifestKeys.push(s3Metadata.key);
      }
    }
    return manifestKeys;
  }

  /**
   * Mostly used for parsing the manifest file in TSV format
   * @param tsvString string with tsv format
   * @returns
   */
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

  /**
   * To group file in their artifact type and filename
   * @param fileRecordListedInManifest
   * @returns A nested json of artifactType
   * E.g. {artifactFastq : { A00001 : [File1, File2] } }
   */
  groupManifestFileByArtifactTypeAndFilename(
    fileRecordListedInManifest: File[]
  ): Record<string, Record<string, File[]>> {
    const groupFiletype: Record<string, Record<string, File[]>> = {};

    /**
     * A helper function to fill the result above
     */
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
        addOrCreateNewArtifactGroup(
          ArtifactType.FASTQ,
          filenameId,
          manifestObj
        );

        // BAM Artifact
      } else if (filename.endsWith("bam") || filename.endsWith("bai")) {
        const firstIndexOfDot = filename.indexOf(".");
        const filenameId = filename.substring(0, firstIndexOfDot);
        addOrCreateNewArtifactGroup(ArtifactType.BAM, filenameId, manifestObj);

        // VCF Artifact
      } else if (filename.endsWith("vcf") || filename.endsWith("tbi")) {
        const firstIndexOfDot = filename.indexOf(".");
        const filenameId = filename.substring(0, firstIndexOfDot);
        addOrCreateNewArtifactGroup(ArtifactType.VCF, filenameId, manifestObj);

        // CRAM Artifact
      } else if (filename.endsWith("cram") || filename.endsWith("crai")) {
        const firstIndexOfDot = filename.indexOf(".");
        const filenameId = filename.substring(0, firstIndexOfDot);
        addOrCreateNewArtifactGroup(ArtifactType.CRAM, filenameId, manifestObj);
      }
    }
    return groupFiletype;
  }

  /**
   * Update current db to updated version
   * @param manifestRecord The updated manifest file
   */
  async updateFileRecordFromManifest(manifestRecord: manifestType) {
    const s3Url = manifestRecord.s3Url;

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
    const fastqArtifact = artifactTypeRecord[ArtifactType.FASTQ];
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

    const artifactBam = artifactTypeRecord[ArtifactType.BAM];
    if (artifactBam) {
      for (const filenameId in artifactBam) {
        const fileSet = sortFileRec(artifactBam[filenameId]);
        analysesOutputArtifactQuery.push(
          insertArtifactBamQuery(fileSet[0], fileSet[1])
        );
      }
    }

    const artifactCram = artifactTypeRecord[ArtifactType.CRAM];
    if (artifactCram) {
      for (const filenameId in artifactCram) {
        const fileSet = sortFileRec(artifactCram[filenameId]);
        analysesOutputArtifactQuery.push(
          insertArtifactCramQuery(fileSet[0], fileSet[1])
        );
      }
    }

    const artifactVcf = artifactTypeRecord[ArtifactType.VCF];
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
   * @param manifestRecordList A list of manifestType record
   * @param s3MetadataList An S3ObjectMetadata list for the particular manifest. (This will populate the size value)
   * @returns
   */
  convertManifestTypeToFileRecord(
    manifestRecordList: manifestType[],
    s3MetadataList: S3ObjectMetadata[]
  ): File[] {
    const result: File[] = [];

    const s3MetadataDict: Record<string, S3ObjectMetadata> = {};
    for (const s3Metadata of s3MetadataList) {
      const s3url = `s3://${AG_BUCKET}/${s3Metadata.key}`;
      s3MetadataDict[s3url] = s3Metadata;
    }

    // TODO: If undefined/list not found
    // print something saying file in manifest not found in the s3 list
    for (const manifestRecord of manifestRecordList) {
      const s3Url = manifestRecord.s3Url;
      const fileSize = s3MetadataDict[s3Url].size;

      if (!fileSize) {
        console.log(`No File foiund (${s3Url})`);
      }
      result.push({
        url: s3Url,
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
   * @param datasetCases A query of datasetCase to be linked to dataset
   */
  async insertDataset(datasetCases: any) {
    // A more dynamic datasetUrl and FlagShip are expected here
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

  async getS3ManifestObjectListByS3KeyPrefix(
    s3KeyPrefix: string
  ): Promise<manifestDict> {
    const s3UrlManifestObj: manifestDict = {};

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

      // The manifest will contain a filename only, but for the purpose of uniquness and how we stored in db.
      // We would append the filename with the s3 Url prefix.
      for (const manifestObj of manifestObjContentList) {
        const s3Url = manifestObj.s3Url;
        s3UrlManifestObj[s3Url] = {
          s3Url: s3Url,
          checksum: manifestObj.checksum,
          agha_study_id: manifestObj.agha_study_id,
        };
      }
    }

    return s3UrlManifestObj;
  }

  async getDbManifestObjectListByDatasetUri(
    datasetUri: string
  ): Promise<manifestDict> {
    const s3UrlManifestObj: manifestDict = {};

    const artifactList = [];

    // Fetching all related artifacts with the datasetUri
    const fastqArtifact =
      await fastqArtifactStudyIdAndFileIdByDatasetUriQuery.run(
        this.edgeDbClient,
        {
          datasetUri: datasetUri,
        }
      );
    console.log(datasetUri);
    artifactList.push(...fastqArtifact);
    const bamArtifact = await bamArtifactStudyIdAndFileIdByDatasetUriQuery.run(
      this.edgeDbClient,
      {
        datasetUri: datasetUri,
      }
    );
    artifactList.push(...bamArtifact);
    const cramArtifact =
      await cramArtifactStudyIdAndFileIdByDatasetUriQuery.run(
        this.edgeDbClient,
        {
          datasetUri: datasetUri,
        }
      );
    artifactList.push(...cramArtifact);
    const vcfArtifact = await vcfArtifactStudyIdAndFileIdByDatasetUriQuery.run(
      this.edgeDbClient,
      {
        datasetUri: datasetUri,
      }
    );
    artifactList.push(...vcfArtifact);
    // Turning artifacts to manifestType object
    for (const artifact of artifactList) {
      // One studyId is expected at this point.
      const agha_study_id = artifact.studyIdList[0][0].value;

      for (const studyId of artifact.fileIdList) {
        // Finding matching files object fields from fileId
        const file = await fileByFileIdQuery.run(this.edgeDbClient, {
          uuid: studyId,
        });

        if (!file) {
          continue; // Mostly not going here
        }
        s3UrlManifestObj[file.url] = {
          s3Url: file.url,
          checksum: getMd5FromChecksumsArray(file.checksums),
          agha_study_id: agha_study_id,
        };
      }
    }

    return s3UrlManifestObj;
  }

  /**
   * Will compare for missing/different studyId
   * set(set(manifestAlpha) - set(manifestBeta))
   * @param manifestAlpha
   * @param manifestBeta
   * @returns
   */
  diffManifestAplhaAndManifestBeta(
    manifestAlpha: manifestDict,
    manifestBeta: manifestDict
  ): manifestType[] {
    const result: manifestType[] = [];

    for (const key in manifestAlpha) {
      const valueAlpha = manifestAlpha[key];
      const valueBeta = manifestBeta[key];

      // Check if alpha exist in Beta
      if (!valueBeta) {
        result.push(valueAlpha);

        // Check if studyId change
      } else if (valueAlpha["agha_study_id"] != valueBeta["agha_study_id"]) {
        result.push(valueAlpha);
      }
    }
    return result;
  }

  checkDiffChecksumRecordBetweenManifestDict(
    manifestAlpha: manifestDict,
    manifestBeta: manifestDict
  ): string[] {
    const result: string[] = [];

    for (const key in manifestAlpha) {
      const valueAlpha = manifestAlpha[key];
      const valueBeta = manifestBeta[key];

      // Check if alpha exist in Beta
      if (valueAlpha["checksum"] != valueBeta["checksum"]) {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * Function to be called on the API layer
   * @param s3KeyPrefix s3 key to sync the files
   */
  async syncDbFromS3KeyPrefix(s3KeyPrefix: string) {
    // CARDIC URI
    const CARDIAC_URI = "urn:fdc:umccr.org:2021:datasets/CARDIAC";

    // Searching match prefix with data in store bucket
    const s3MetadataList = await this.getS3ObjectListFromKeyPrefix(s3KeyPrefix);
    const manifestKeyList = this.getManifestKeyFromS3ObjectList(s3MetadataList);

    // GRAB all manifestType object from all manifest file in s3
    const s3ManifestTypeObjectDict =
      await this.getS3ManifestObjectListByS3KeyPrefix(s3KeyPrefix);

    // Grab all manifestType object from edgedDB here
    const dbManifestTypeObjectDict =
      await this.getDbManifestObjectListByDatasetUri(CARDIAC_URI);

    // Do comparison which and have report of which exist more or less
    const missingFileFromDb = this.diffManifestAplhaAndManifestBeta(
      s3ManifestTypeObjectDict,
      dbManifestTypeObjectDict
    );
    const toBeDeletedFromDb = this.diffManifestAplhaAndManifestBeta(
      dbManifestTypeObjectDict,
      s3ManifestTypeObjectDict
    );
    const differentChecksum = this.checkDiffChecksumRecordBetweenManifestDict(
      dbManifestTypeObjectDict,
      s3ManifestTypeObjectDict
    );

    // Insert missing files to DB
    if (missingFileFromDb.length) {
      const groupedMissingRecByStudyId =
        this.groupManifestByStudyId(missingFileFromDb);

      const listOfStudyId = Object.keys(groupedMissingRecByStudyId);
      for (const studyId of listOfStudyId) {
        const manifestRecord = groupedMissingRecByStudyId[studyId];

        // Convert to FILE record
        const fileRecordList = this.convertManifestTypeToFileRecord(
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
