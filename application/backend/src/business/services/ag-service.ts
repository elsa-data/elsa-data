import { S3Client } from "@aws-sdk/client-s3";
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
  fastqArtifactStudyIdAndFileIdByDatasetIdQuery,
  bamArtifactStudyIdAndFileIdByDatasetIdQuery,
  vcfArtifactStudyIdAndFileIdByDatasetIdQuery,
  cramArtifactStudyIdAndFileIdByDatasetIdQuery,
} from "../db/lab-queries";
import { fileByFileIdQuery, fileByUrlQuery } from "../db/storage-queries";
import {
  makeEmptyIdentifierArray,
  makeSystemlessIdentifierArray,
  getMd5FromChecksumsArray,
} from "../db/helper";
const util = require("util");

// need to be configuration eventually
const AG_BUCKET = "agha-gdr-store-2.0";

// Static Mapping of AG bucket prefix and DatasetURI
const BUCKET_PREFIX_AND_URI_MAPPING: Record<string, string> = {
  cardiac: "urn:fdc:australiangenomics.org.au:2022:datasets/cardiac",
};

/**
 * Manifest Type as what current AG manifest data will look like
 */
type manifestType = {
  checksum: string;
  agha_study_id: string;
  filename: string;
};
type s3ManifestType = {
  checksum: string;
  agha_study_id: string;
  s3Url: string;
};
type manifestDict = Record<string, s3ManifestType>;

@injectable()
@singleton()
export class AGService {
  constructor(
    @inject("S3Client") private s3Client: S3Client,
    @inject("Database") private edgeDbClient: edgedb.Client
  ) {}

  async getDatasetIdByS3KeyPrefix(
    s3KeyPrefix: string
  ): Promise<string | undefined> {
    const flagshipPrefix = s3KeyPrefix.toLowerCase().split("/")[0];
    let datasetUri = BUCKET_PREFIX_AND_URI_MAPPING[flagshipPrefix];

    if (!datasetUri) return;

    const selectDatasetIdQuery = e.select(e.dataset.Dataset, (d) => ({
      id: true,
      filter: e.op(d.uri, "ilike", datasetUri),
    }));

    // Find current Dataset
    const datasetIdArray = await selectDatasetIdQuery.run(this.edgeDbClient);
    const datasetId = datasetIdArray[0]?.id;
    if (datasetId) return datasetId;

    // Else, create new dataset
    const insertDatasetQuery = e.insert(e.dataset.Dataset, {
      uri: datasetUri,
      description: `A ${flagshipPrefix} flagship.`,
    });
    const newDataset = await insertDatasetQuery.run(this.edgeDbClient);
    return newDataset.id;
  }

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
   * Mostly used for parsing the manifest file from TSV format
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
    manifestContentList: s3ManifestType[]
  ): Record<string, s3ManifestType[]> {
    const studyIdGroup: Record<string, s3ManifestType[]> = {};
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
      const s3UrlPrefix = `s3://${AG_BUCKET}/${manifestS3Prefix}`;

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
        const s3Url = `${s3UrlPrefix}/${manifestObj.filename}`;
        s3UrlManifestObj[s3Url] = {
          s3Url: s3Url,
          checksum: manifestObj.checksum,
          agha_study_id: manifestObj.agha_study_id,
        };
      }
    }
    return s3UrlManifestObj;
  }

  /**
   * To group file in their artifact type and filename.
   * The function will determine artifacttype by
   * @param fileRecordListedInManifest
   * @returns A nested json of artifactType AND filenameId
   * E.g. From {FASTQ : { A00001 : [File1, File2] } }
   */
  groupManifestFileByArtifactTypeAndFilename(
    fileRecordListedInManifest: File[]
  ): Record<string, Record<string, File[]>> {
    const groupFiletype: Record<string, Record<string, File[]>> = {};

    /**
     * A helper function to fill the above variable
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
      const filename = manifestObj.url.replaceAll(/.gz|.tbi|.bai|.crai/g, ""); // Removing index/compressed extension to find base filename.

      // FASTQ Artifact
      if (filename.endsWith(".fastq") || filename.endsWith(".fq")) {
        const filenameId = filename.replaceAll(/_R1|_R2|.R1|.R2/g, "");
        addOrCreateNewArtifactGroup(
          ArtifactType.FASTQ,
          filenameId,
          manifestObj
        );

        // BAM Artifact
      } else if (filename.endsWith(".bam") || filename.endsWith(".bai")) {
        addOrCreateNewArtifactGroup(ArtifactType.BAM, filename, manifestObj);

        // VCF Artifact
      } else if (filename.endsWith(".vcf") || filename.endsWith(".tbi")) {
        addOrCreateNewArtifactGroup(ArtifactType.VCF, filename, manifestObj);

        // CRAM Artifact
      } else if (filename.endsWith(".cram") || filename.endsWith(".crai")) {
        addOrCreateNewArtifactGroup(ArtifactType.CRAM, filename, manifestObj);
      } else {
        console.log(`No matching Artifact Type (${filename})`);
      }
    }
    return groupFiletype;
  }

  /**
   * Update current File object with recent record
   * @param newFileRec The updated File record
   */
  async updateFileRecordFromManifest(newFileRec: File) {
    const s3Url = newFileRec.url;

    // Find current checksum record
    const fileRec = await fileByUrlQuery.run(this.edgeDbClient, { url: s3Url });
    const currentChecksum = fileRec[0]?.checksums ?? [];
    for (const checksumRec of currentChecksum) {
      if (checksumRec.type === "MD5") {
        checksumRec.value = getMd5FromChecksumsArray(newFileRec.checksums);
      }
    }

    // Update
    const updateQuery = e.update(e.storage.File, (file) => ({
      filter: e.op(file.url, "ilike", s3Url),
      set: {
        checksums: currentChecksum,
        size: newFileRec.size,
      },
    }));
    await updateQuery.run(this.edgeDbClient);
  }

  /**
   * Inserting new artifacts to records
   * @param artifactTypeRecord A File grouped of artifact type and studyId .
   * E.g. {FASTQ : { A00001 : [File1, File2] } }
   * @returns
   */
  insertNewArtifactListQuery(
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

    // Inserting to a SubmissionBatch
    const artifactArray: any[] = [];

    for (const artifactType in artifactTypeRecord) {
      const fileRecByFilenameId = artifactTypeRecord[artifactType];

      for (const filenameId in fileRecByFilenameId) {
        const fileSet = sortFileRec(fileRecByFilenameId[filenameId]);

        if (fileSet.length != 2) {
          console.log(
            `"${filenameId}" has no matching pair. Skipping automatic update... `
          );
          continue;
        }

        if (artifactType == ArtifactType.FASTQ) {
          artifactArray.push(
            insertArtifactFastqPairQuery(fileSet[0], fileSet[1])
          );
        } else if (artifactType == ArtifactType.VCF) {
          artifactArray.push(insertArtifactVcfQuery(fileSet[0], fileSet[1]));
        } else if (artifactType == ArtifactType.BAM) {
          artifactArray.push(insertArtifactBamQuery(fileSet[0], fileSet[1]));
        } else if (artifactType == ArtifactType.CRAM) {
          artifactArray.push(insertArtifactCramQuery(fileSet[0], fileSet[1]));
        }
      }
    }
    return artifactArray;
  }

  /**
   * Convert manifest record to a File record as file Db is stored as file record.
   * @param manifestRecordList A list of s3ManifestType record
   * @param s3MetadataList An S3ObjectMetadata list for the particular manifest. (This will populate the size value)
   * @returns
   */
  converts3ManifestTypeToFileRecord(
    manifestRecordList: s3ManifestType[],
    s3MetadataList: S3ObjectMetadata[]
  ): File[] {
    const result: File[] = [];

    const s3MetadataDict: Record<string, S3ObjectMetadata> = {};
    for (const s3Metadata of s3MetadataList) {
      const s3url = `s3://${AG_BUCKET}/${s3Metadata.key}`;
      s3MetadataDict[s3url] = s3Metadata;
    }
    for (const manifestRecord of manifestRecordList) {
      const s3Url = manifestRecord.s3Url;
      const fileSize = s3MetadataDict[s3Url]?.size;

      if (!fileSize || !s3Url) {
        console.log(`No File found (${s3Url})`);
        continue;
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

  async updateDatasetPatient(
    datasetPatientId: string,
    insertArtifactListQuery: any
  ) {
    const updateDatapatientQuery = e.update(
      e.dataset.DatasetSpecimen,
      (specimen) => ({
        set: {
          artifacts: {
            "+=": e.set(...insertArtifactListQuery),
          },
        },
        filter: e.op(specimen.patient.id, "=", e.uuid(datasetPatientId)),
      })
    );
    await updateDatapatientQuery.run(this.edgeDbClient);
  }

  async getDatasetPatientByStudyId(studyId: string) {
    const findDPQuery = e.select(e.dataset.DatasetPatient, (dp) => ({
      id: true,
      filter: e.op(
        e.dataset.DatasetPatient.externalIdentifiers,
        "=",
        makeSystemlessIdentifierArray(studyId)
      ),
    }));

    const datasetPatientIdArray = await findDPQuery.run(this.edgeDbClient);
    return datasetPatientIdArray[0]?.id;
  }

  /**
   * Inserting artifacts query to appropriate datacase
   * @param datasetId
   * @param studyId
   * @param insertArtifactListQuery
   * @returns
   */
  async insertNewDatsetPatientByDatasetId(
    datasetId: string,
    studyId: string,
    insertArtifactListQuery: any
  ) {
    const insertDatasetPatientQuery = e.insert(e.dataset.DatasetPatient, {
      externalIdentifiers: makeSystemlessIdentifierArray(studyId),
      specimens: e.set(
        e.insert(e.dataset.DatasetSpecimen, {
          externalIdentifiers: makeEmptyIdentifierArray(),
          artifacts: e.set(...insertArtifactListQuery),
        })
      ),
    });
    const insertDatasetCaseQuery = e.insert(e.dataset.DatasetCase, {
      externalIdentifiers: makeSystemlessIdentifierArray(studyId),
      patients: e.set(insertDatasetPatientQuery),
    });

    const linkDatasetQuery = e.update(e.dataset.Dataset, (dataset) => ({
      set: {
        cases: {
          "+=": insertDatasetCaseQuery,
        },
      },
      filter: e.op(dataset.id, "=", e.uuid(datasetId)),
    }));
    await linkDatasetQuery.run(this.edgeDbClient);
  }

  async getDbManifestObjectListByDatasetId(
    datasetId: string
  ): Promise<manifestDict> {
    const s3UrlManifestObj: manifestDict = {};

    const artifactList = [];

    // Fetching all related artifacts with the datasetUri
    const fastqArtifact =
      await fastqArtifactStudyIdAndFileIdByDatasetIdQuery.run(
        this.edgeDbClient,
        {
          datasetId: datasetId,
        }
      );
    artifactList.push(...fastqArtifact);
    const bamArtifact = await bamArtifactStudyIdAndFileIdByDatasetIdQuery.run(
      this.edgeDbClient,
      {
        datasetId: datasetId,
      }
    );
    artifactList.push(...bamArtifact);
    const cramArtifact = await cramArtifactStudyIdAndFileIdByDatasetIdQuery.run(
      this.edgeDbClient,
      {
        datasetId: datasetId,
      }
    );
    artifactList.push(...cramArtifact);
    const vcfArtifact = await vcfArtifactStudyIdAndFileIdByDatasetIdQuery.run(
      this.edgeDbClient,
      {
        datasetId: datasetId,
      }
    );
    artifactList.push(...vcfArtifact);

    // Turning artifact records to s3ManifestType object
    for (const artifact of artifactList) {
      // One studyId is expected at this point.
      const agha_study_id = artifact.studyIdList[0][0].value;

      for (const fileId of artifact.fileIdList) {
        // Finding matching files object fields from fileId
        const file = await fileByFileIdQuery.run(this.edgeDbClient, {
          uuid: fileId,
        });

        if (!file) {
          continue; // Should not going here
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
  ): s3ManifestType[] {
    const result: s3ManifestType[] = [];

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

  /**
   *
   * @param newManifest
   * @param oldManifest
   * @returns The new manifestType that needs to be corrected
   */
  checkDiffChecksumRecordBetweenManifestDict(
    newManifest: manifestDict,
    oldManifest: manifestDict
  ): s3ManifestType[] {
    const result: s3ManifestType[] = [];
    for (const key in newManifest) {
      const newVal = newManifest[key];
      const oldVal = oldManifest[key];

      if (!newVal || !oldVal) {
        continue;
      }

      // Check if alpha exist in Beta
      if (newVal["checksum"] != oldVal["checksum"]) {
        result.push(newVal);
      }
    }
    return result;
  }

  /**
   * @param s3KeyPrefix s3 key to sync the files
   */
  async syncDbFromS3KeyPrefix(s3KeyPrefix: string) {
    const datasetId = await this.getDatasetIdByS3KeyPrefix(s3KeyPrefix);
    if (!datasetId) {
      console.log("No DataCase found for this prefix.");
      console.log("Please insert a new datacase before running this function");
      return;
    }

    // Searching match prefix with data in S3 store bucket
    const s3MetadataList = await this.getS3ObjectListFromKeyPrefix(s3KeyPrefix);

    // Grab all s3ManifestType object from all manifest files in s3
    const s3ManifestTypeObjectDict =
      await this.getS3ManifestObjectListByS3KeyPrefix(s3KeyPrefix);

    // Grab all s3ManifestType object from current edgedb
    const dbs3ManifestTypeObjectDict =
      await this.getDbManifestObjectListByDatasetId(datasetId);
    // Do comparison for data retreive from s3 and with current edgedb data
    const missingFileFromDb = this.diffManifestAplhaAndManifestBeta(
      s3ManifestTypeObjectDict,
      dbs3ManifestTypeObjectDict
    );
    const toBeDeletedFromDb = this.diffManifestAplhaAndManifestBeta(
      dbs3ManifestTypeObjectDict,
      s3ManifestTypeObjectDict
    );
    const differentChecksum = this.checkDiffChecksumRecordBetweenManifestDict(
      s3ManifestTypeObjectDict,
      dbs3ManifestTypeObjectDict
    );

    // Handle for data that is deleted from s3
    if (toBeDeletedFromDb.length) {
      console.log(`Data to be deleted: ${toBeDeletedFromDb}`);
    }

    // Handle for checksum different
    if (differentChecksum.length) {
      const fileRecChangeList = this.converts3ManifestTypeToFileRecord(
        differentChecksum,
        s3MetadataList
      );

      for (const fileRec of fileRecChangeList) {
        await this.updateFileRecordFromManifest(fileRec);
      }
    }

    // Insert missing files to DB
    if (missingFileFromDb.length) {
      const groupedMissingRecByStudyId =
        this.groupManifestByStudyId(missingFileFromDb);

      const listOfStudyId = Object.keys(groupedMissingRecByStudyId);
      for (const studyId of listOfStudyId) {
        const manifestRecord = groupedMissingRecByStudyId[studyId];

        // Convert to FILE record (storage::File schema)
        const fileRecordList = this.converts3ManifestTypeToFileRecord(
          manifestRecord,
          s3MetadataList
        );

        // Group file for further processing
        const groupArtifactType =
          this.groupManifestFileByArtifactTypeAndFilename(fileRecordList);

        // Insert Artifact
        const insertArtifactListQuery =
          this.insertNewArtifactListQuery(groupArtifactType);

        const datasetPatientId = await this.getDatasetPatientByStudyId(studyId);

        if (datasetPatientId) {
          // Updating current dataset patient
          await this.updateDatasetPatient(
            datasetPatientId,
            insertArtifactListQuery
          );
        } else {
          // Insert New DatasetPatient
          await this.insertNewDatsetPatientByDatasetId(
            datasetId,
            studyId,
            insertArtifactListQuery
          );
        }
      }
    }
  }
}
