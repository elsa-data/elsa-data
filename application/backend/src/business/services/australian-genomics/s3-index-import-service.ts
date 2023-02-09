import { S3Client } from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import e from "../../../../dbschema/edgeql-js";
import { inject, injectable, singleton } from "tsyringe";
import {
  S3ObjectMetadata,
  awsListObjects,
  readObjectToStringFromS3Url,
} from "../aws-helper";
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
} from "../../db/lab-queries";
import { fileByFileIdQuery, fileByUrlQuery } from "../../db/storage-queries";
import {
  makeSystemlessIdentifierArray,
  getMd5FromChecksumsArray,
} from "../../db/helper";
import { isNil } from "lodash";
import {
  selectPedigreeByDatasetCaseIdQuery,
  insertPedigreeByDatasetCaseIdQuery,
  updatePedigreeProbandAndDatasetPatientQuery,
  updatePedigreeMaternalRelationshipQuery,
  updatePedigreePaternalRelationshipQuery,
} from "../../db/pedigree-queries";
import {
  selectDatasetPatientByExternalIdentifiersQuery,
  selectDatasetCaseByExternalIdentifiersQuery,
  selectDatasetIdByDatasetUri,
} from "../../db/dataset-queries";
import { DatasetService } from "../dataset-service";
import { dataset } from "../../../../dbschema/interfaces";

/**
 * Manifest Type as what current AG manifest data will look like
 */
export type manifestType = {
  checksum: string;
  agha_study_id: string;
  filename: string;
};
export type s3ManifestType = {
  checksum: string;
  agha_study_id_array: string[];
  s3Url: string;
};
export type s3IndividualManifestType = s3ManifestType & {
  agha_study_id: string;
};
export type artifactType = { sampleIdsArray: string[] } & File;
export type manifestDict = Record<string, s3ManifestType>;

@injectable()
@singleton()
export class S3IndexApplicationService {
  constructor(
    @inject("S3Client") private s3Client: S3Client,
    @inject("Database") private edgeDbClient: edgedb.Client,
    private datasetService: DatasetService
  ) {}

  /**
   * @param s3UrlPrefix Prefix to search
   * @returns A list of S3 object metadata for AG bucket matching key prefix
   */
  async getS3ObjectListFromUriPrefix(
    s3UrlPrefix: string
  ): Promise<S3ObjectMetadata[]> {
    return await awsListObjects(this.s3Client, s3UrlPrefix);
  }

  /**
   * @param s3ListMetadata
   * @returns A list of manifest string
   */
  getManifestUriFromS3ObjectList(s3ListMetadata: S3ObjectMetadata[]): string[] {
    const manifestKeys: string[] = [];
    for (const s3Metadata of s3ListMetadata) {
      if (s3Metadata.s3Url.endsWith("manifest.txt")) {
        manifestKeys.push(s3Metadata.s3Url);
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
      const currentLine = lines[i].split("\t");
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentLine[j];
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
    manifestContentList: s3IndividualManifestType[]
  ): Record<string, s3IndividualManifestType[]> {
    const studyIdGroup: Record<string, s3IndividualManifestType[]> = {};
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

  async getS3ManifestObjectListByS3UrlPrefix(
    s3UrlPrefix: string
  ): Promise<manifestDict> {
    const s3UrlManifestObj: manifestDict = {};

    const s3MetadataList = await this.getS3ObjectListFromUriPrefix(s3UrlPrefix);
    const manifestUriList = this.getManifestUriFromS3ObjectList(s3MetadataList);

    for (const manifestS3Url of manifestUriList) {
      const manifestTsvContent = await readObjectToStringFromS3Url(
        this.s3Client,
        manifestS3Url
      );

      const manifestObjContentList = <manifestType[]>(
        this.convertTsvToJson(manifestTsvContent)
      );

      // The manifest will contain a filename only, but for the purpose of uniqueness and how we stored in db.
      // We would append the filename with the s3 Url prefix.
      const manifestLastSlashIndex = manifestS3Url.lastIndexOf("/");
      const manifestS3UrlPrefix = manifestS3Url.substring(
        0,
        manifestLastSlashIndex
      );
      for (const manifestObj of manifestObjContentList) {
        const s3Url = `${manifestS3UrlPrefix}/${manifestObj.filename}`;
        s3UrlManifestObj[s3Url] = {
          s3Url: s3Url,
          checksum: manifestObj.checksum,
          agha_study_id_array: manifestObj.agha_study_id.split(","),
        };
      }
    }
    return s3UrlManifestObj;
  }

  /**
   * To group file in their artifact type and filename.
   * The function will determine artifact type by
   * @param fileRecordListedInManifest
   * @returns A nested json of artifactType AND filenameId
   * E.g. From {FASTQ : { A00001 : [File1, File2] } }
   */
  groupManifestFileByArtifactTypeAndFilename(
    fileRecordListedInManifest: artifactType[]
  ): Record<string, Record<string, artifactType[]>> {
    const groupFiletype: Record<string, Record<string, artifactType[]>> = {};

    /**
     * A helper function to fill the above variable
     */
    function addOrCreateNewArtifactGroup(
      artifactType: string,
      filenameId: string,
      manifestObj: artifactType
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
    const currentChecksum = fileRec?.checksums ?? [];
    for (const checksumRec of currentChecksum) {
      if (checksumRec.type === "MD5") {
        checksumRec.value = getMd5FromChecksumsArray(newFileRec.checksums);
      }
    }

    // Update
    const updateQuery = e.update(e.storage.File, (file: { url: any }) => ({
      filter: e.op(file.url, "ilike", s3Url),
      set: {
        checksums: currentChecksum,
        size: newFileRec.size,
      },
    }));
    await updateQuery.run(this.edgeDbClient);
  }

  /**
   * We do not allow to delete file record (to prevent linking problem), in return we mark the file object no longer available
   * @param s3Url The unique s3Url
   */
  async updateUnavailableFileRecord(s3Url: string) {
    const updateQuery = e
      .update(e.storage.File, (file: { url: any }) => ({
        filter: e.op(file.url, "ilike", s3Url),
        set: {
          isDeleted: true,
        },
      }))
      .assert_single();
    await updateQuery.run(this.edgeDbClient);
  }

  /**
   * Inserting new artifacts to records
   * @param artifactTypeRecord A File grouped of artifact type and studyId .
   * E.g. {FASTQ : { A00001 : [File1, File2] } }
   * @returns
   */
  insertNewArtifactListQuery(
    artifactTypeRecord: Record<string, Record<string, artifactType[]>>
  ) {
    /**
     * Sorting url function to identify which is forward/reversed/indexed file
     * Index 0 is Forward file or base file
     * Index 1 if Reverse file or index file
     */
    const sortArtifactRec = (artifactSet: artifactType[]) =>
      artifactSet.sort((a, b) =>
        a.url.toLowerCase() > b.url.toLowerCase() ? 1 : -1
      );

    // Inserting to a SubmissionBatch
    const artifactArray: any[] = [];

    for (const artifactType in artifactTypeRecord) {
      const fileRecByFilenameId = artifactTypeRecord[artifactType];

      for (const filenameId in fileRecByFilenameId) {
        const fileSet = sortArtifactRec(fileRecByFilenameId[filenameId]);

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
          artifactArray.push(
            insertArtifactVcfQuery(
              fileSet[0],
              fileSet[1],
              fileSet[0].sampleIdsArray
            )
          );
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
  converts3ManifestTypeToArtifactTypeRecord(
    manifestRecordList: s3IndividualManifestType[],
    s3MetadataList: S3ObjectMetadata[]
  ): artifactType[] {
    const result: artifactType[] = [];

    const s3MetadataDict: Record<string, S3ObjectMetadata> = {};
    for (const s3Metadata of s3MetadataList) {
      s3MetadataDict[s3Metadata.s3Url] = s3Metadata;
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
            type: "MD5",
            value: manifestRecord.checksum,
          },
        ],
        sampleIdsArray: manifestRecord.agha_study_id_array,
      });
    }

    return result;
  }

  async updateDatasetPatient(
    datasetPatientUUID: string,
    insertArtifactListQuery: any
  ) {
    const updateDataPatientQuery = e.update(
      e.dataset.DatasetSpecimen,
      (specimen: { patient: { id: any } }) => ({
        set: {
          artifacts: {
            "+=": e.set(...insertArtifactListQuery),
          },
        },
        filter: e.op(specimen.patient.id, "=", e.uuid(datasetPatientUUID)),
      })
    );
    await updateDataPatientQuery.run(this.edgeDbClient);
  }

  async getDatasetPatientByStudyId(studyId: string) {
    const findDPQuery = selectDatasetPatientByExternalIdentifiersQuery(studyId);

    const datasetPatientIdArray = await findDPQuery.run(this.edgeDbClient);
    return datasetPatientIdArray[0]?.id;
  }

  async getDatasetCaseByCaseId(caseId: string) {
    const findDCQuery = selectDatasetCaseByExternalIdentifiersQuery(caseId);
    const datasetCaseIdArray = await findDCQuery.run(this.edgeDbClient);
    return datasetCaseIdArray[0]?.id;
  }

  async getPedigreeByDatasetCaseId(
    datasetCaseId: string
  ): Promise<string | null> {
    const pedigreeIdArray = await selectPedigreeByDatasetCaseIdQuery(
      datasetCaseId
    ).run(this.edgeDbClient);

    let pedigreeUUID: string | null;
    if (!pedigreeIdArray.length) {
      pedigreeUUID = null;
    } else {
      pedigreeUUID = pedigreeIdArray[0].id;
    }

    return pedigreeUUID;
  }

  async insertNewDatasetCase({
    datasetCaseId,
    datasetUUID,
  }: {
    datasetCaseId: string;
    datasetUUID: string;
  }) {
    const insertPedigreeQuery = e.insert(e.pedigree.Pedigree, {});
    const insertDatasetCaseQuery = e.insert(e.dataset.DatasetCase, {
      externalIdentifiers: makeSystemlessIdentifierArray(datasetCaseId),
      pedigree: insertPedigreeQuery,
    });

    const linkDatasetQuery = e.update(e.dataset.Dataset, (dataset: any) => ({
      set: {
        cases: {
          "+=": insertDatasetCaseQuery,
        },
      },
      filter: e.op(dataset.id, "=", e.uuid(datasetUUID)),
    }));
    await linkDatasetQuery.run(this.edgeDbClient);
  }

  async insertNewDatasetPatientByDatasetCaseId({
    datasetCaseId,
    patientId,
  }: {
    datasetCaseId: string;
    patientId: string;
  }) {
    let sexAtBirth: dataset.SexAtBirthType | null = patientId.endsWith("_pat")
      ? "male"
      : patientId.endsWith("_mat")
      ? "female"
      : null;

    const insertDatasetSpecimenQuery = e.insert(e.dataset.DatasetSpecimen, {});
    const insertDatasetPatientQuery = e.insert(e.dataset.DatasetPatient, {
      sexAtBirth: sexAtBirth,
      externalIdentifiers: makeSystemlessIdentifierArray(patientId),
      specimens: e.set(insertDatasetSpecimenQuery),
    });

    const linkDatasetCaseQuery = e.update(e.dataset.DatasetCase, (dc) => ({
      set: {
        patients: {
          "+=": insertDatasetPatientQuery,
        },
      },
      filter: e.op(
        dc.externalIdentifiers,
        "=",
        makeSystemlessIdentifierArray(datasetCaseId)
      ),
    }));
    await linkDatasetCaseQuery.run(this.edgeDbClient);
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
      // Multiple studyId is expected at this point.
      const externalIdentifiersArray = artifact.studyIdList;
      // Will assume that only one externalIdentifier exist in the array.
      const studyIdList = externalIdentifiersArray.map((ei) => ei[0].value);

      for (const fileId of artifact.fileIdList) {
        // Finding matching files object fields from fileId
        const file = await fileByFileIdQuery.run(this.edgeDbClient, {
          uuid: fileId,
        });

        if (!file) {
          continue; // Should not go here
        }

        s3UrlManifestObj[file.url] = {
          s3Url: file.url,
          checksum: getMd5FromChecksumsArray(file.checksums),
          agha_study_id_array: studyIdList,
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
  diffManifestAlphaAndManifestBeta(
    manifestAlpha: manifestDict,
    manifestBeta: manifestDict
  ): s3IndividualManifestType[] {
    const result: s3IndividualManifestType[] = [];

    const insertRes = (manifest: s3ManifestType, studyId: string) => {
      result.push({
        checksum: manifest.checksum,
        s3Url: manifest.s3Url,
        agha_study_id_array: manifest.agha_study_id_array,
        agha_study_id: studyId,
      });
    };

    for (const key in manifestAlpha) {
      const valueAlpha = manifestAlpha[key];
      const valueBeta = manifestBeta[key];

      // Check if alpha exist in Beta
      if (!valueBeta) {
        valueAlpha.agha_study_id_array.map((SID) => {
          insertRes(valueAlpha, SID);
        });
        continue;
      }

      // Check if studyId in Alpha does not exist in Beta
      const studyIdAlpha = valueAlpha["agha_study_id_array"];
      const studyIdBeta = valueBeta["agha_study_id_array"];
      for (const studyId of studyIdAlpha) {
        if (!studyIdBeta.includes(studyId)) {
          insertRes(valueAlpha, studyId);
        }
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
  ): s3IndividualManifestType[] {
    const result: s3IndividualManifestType[] = [];
    for (const key in newManifest) {
      const newVal = newManifest[key];
      const oldVal = oldManifest[key];

      if (!newVal || !oldVal) {
        continue;
      }

      // Check if alpha exist in Beta
      if (newVal["checksum"] != oldVal["checksum"]) {
        result.push({
          agha_study_id: newVal.agha_study_id_array.join(","),
          agha_study_id_array: newVal.agha_study_id_array,
          checksum: newVal.checksum,
          s3Url: newVal.s3Url,
        });
      }
    }
    return result;
  }

  async linkPedigreeRelationship(
    pedigreeList: {
      probandId: string;
      patientId: string;
      datasetCaseId: string;
    }[]
  ) {
    for (const pedigree of pedigreeList) {
      const { probandId, patientId, datasetCaseId } = pedigree;

      // Find existing pedigree has exist
      let pedigreeUUID = await this.getPedigreeByDatasetCaseId(datasetCaseId);

      if (!pedigreeUUID) {
        // Ideally it empty pedigree should be initiated above.
        // This will catch incase old implementation did not create pedigree.

        await insertPedigreeByDatasetCaseIdQuery(datasetCaseId).run(
          this.edgeDbClient
        );

        // Will run this one more time
        pedigreeUUID = await this.getPedigreeByDatasetCaseId(datasetCaseId);

        if (!pedigreeUUID) {
          console.warn(`Cannot create Pedigree ${datasetCaseId}. Skipping ...`);
          continue;
        }
      }

      if (patientId.toLowerCase().endsWith("_mat")) {
        await updatePedigreeMaternalRelationshipQuery({
          pedigreeUUID: pedigreeUUID,
          probandId: probandId,
          maternalId: patientId,
        }).run(this.edgeDbClient);
      } else if (patientId.toLowerCase().endsWith("_pat")) {
        await updatePedigreePaternalRelationshipQuery({
          pedigreeUUID: pedigreeUUID,
          probandId: probandId,
          paternalId: patientId,
        }).run(this.edgeDbClient);
      } else {
        await updatePedigreeProbandAndDatasetPatientQuery({
          probandId: patientId,
          pedigreeUUID: pedigreeUUID,
        }).run(this.edgeDbClient);
      }
    }
  }

  /**
   * @param datasetUri s3 URI prefix to sync the files
   */
  async syncDbFromDatasetUri(datasetUri: string) {
    const datasetId = (
      await selectDatasetIdByDatasetUri(datasetUri).run(this.edgeDbClient)
    )?.id;

    if (!datasetId) {
      console.warn("No Dataset URI found from given key prefix.");
      console.warn(
        "Please register to the configuration before running this service."
      );
      return;
    }

    const s3UrlPrefix =
      this.datasetService.getUriPrefixFromFromDatasetUri(datasetUri);
    if (!s3UrlPrefix) {
      console.warn("No Storage Dataset URI found.");
      return;
    }

    // Searching match prefix with data in S3 store bucket
    const s3MetadataList = await this.getS3ObjectListFromUriPrefix(s3UrlPrefix);

    // Grab all s3ManifestType object from all manifest files in s3
    const s3ManifestTypeObjectDict =
      await this.getS3ManifestObjectListByS3UrlPrefix(s3UrlPrefix);

    // Grab all s3ManifestType object from current edgedb
    const dbs3ManifestTypeObjectDict =
      await this.getDbManifestObjectListByDatasetId(datasetId);

    // Do comparison for data retrieve from s3 and with current edgedb data
    const missingFileFromDb = this.diffManifestAlphaAndManifestBeta(
      s3ManifestTypeObjectDict,
      dbs3ManifestTypeObjectDict
    );
    const toBeDeletedFromDb = this.diffManifestAlphaAndManifestBeta(
      dbs3ManifestTypeObjectDict,
      s3ManifestTypeObjectDict
    );
    const differentChecksum = this.checkDiffChecksumRecordBetweenManifestDict(
      s3ManifestTypeObjectDict,
      dbs3ManifestTypeObjectDict
    );

    // Update file record to be unavailable
    if (toBeDeletedFromDb.length) {
      for (const f of toBeDeletedFromDb) {
        await this.updateUnavailableFileRecord(f.s3Url);
      }
    }

    // Handle for checksum different
    if (differentChecksum.length) {
      const fileRecChangeList = this.converts3ManifestTypeToArtifactTypeRecord(
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

      const patientIdAndDataCaseIdLinkingArray = [];
      const listOfStudyIds = Object.keys(groupedMissingRecByStudyId);
      for (const studyId of listOfStudyIds) {
        const manifestRecord = groupedMissingRecByStudyId[studyId];

        // Convert to artifactType containing FILE record (storage::File schema).
        const artifactList = this.converts3ManifestTypeToArtifactTypeRecord(
          manifestRecord,
          s3MetadataList
        );

        // Group file for further processing
        const groupArtifactType =
          this.groupManifestFileByArtifactTypeAndFilename(artifactList);

        // Insert Artifact
        const insertArtifactListQuery =
          this.insertNewArtifactListQuery(groupArtifactType);

        let datasetPatientUUID = await this.getDatasetPatientByStudyId(studyId);

        if (!datasetPatientUUID) {
          // Group Families to a single DatasetCase
          // Temporarily will be using FAMXXX id if exist in filename else probandId will be used.
          // Assumption:
          //  - Proband studyId will be 1:1 relationship with the familyId included in filename.
          //  - All files with the same Proband studyId will have the same familyId included in filenames.

          const probandId = studyId.split("_")[0];

          const famRe = /(FAM\d+)/gi;
          const s3Url = manifestRecord[0].s3Url;
          const famReMatch: string[] | null = s3Url.match(famRe);
          const familyId = famReMatch ? famReMatch[0] : null;

          const datasetCaseId = familyId ? familyId : probandId;

          // Grouping and passing this array for the pedigree relationship below.
          patientIdAndDataCaseIdLinkingArray.push({
            probandId: probandId,
            datasetCaseId: datasetCaseId,
            patientId: studyId,
          });

          let datasetCaseUUID = await this.getDatasetCaseByCaseId(
            datasetCaseId
          );
          if (!datasetCaseUUID) {
            await this.insertNewDatasetCase({
              datasetUUID: datasetId,
              datasetCaseId: datasetCaseId,
            });

            datasetCaseUUID = await this.getDatasetCaseByCaseId(datasetCaseId);
            if (isNil(datasetCaseUUID)) {
              console.error(
                `Unable to insert a new DatasetCase (${datasetCaseId})`
              );
              continue;
            }
          }

          await this.insertNewDatasetPatientByDatasetCaseId({
            datasetCaseId: datasetCaseId,
            patientId: studyId,
          });
          datasetPatientUUID = await this.getDatasetPatientByStudyId(studyId);
          if (isNil(datasetPatientUUID)) {
            console.error(`Unable to insert a new DatasetPatient (${studyId})`);
            continue;
          }
        }

        await this.updateDatasetPatient(
          datasetPatientUUID,
          insertArtifactListQuery
        );
      }

      // Handling pedigree Linking
      // At this stage, all dataset::DatasetPatient record should already exist
      await this.linkPedigreeRelationship(patientIdAndDataCaseIdLinkingArray);
    }

    // Update last update on Dataset
    await this.datasetService.updateDatasetCurrentTimestamp(datasetId);
  }
}
