import { S3Client } from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import e from "../../../../dbschema/edgeql-js";
import { inject, injectable } from "tsyringe";
import {
  awsListObjects,
  readObjectToStringFromS3Url,
  S3ObjectMetadataType,
} from "../aws/aws-helper";
import {
  ArtifactEnum,
  bamArtifactStudyIdAndFileIdByDatasetIdQuery,
  cramArtifactStudyIdAndFileIdByDatasetIdQuery,
  fastqArtifactStudyIdAndFileIdByDatasetIdQuery,
  File,
  insertArtifactBamQuery,
  insertArtifactCramQuery,
  insertArtifactFastqPairQuery,
  insertArtifactVcfQuery,
  vcfArtifactStudyIdAndFileIdByDatasetIdQuery,
} from "../../db/lab-queries";
import { fileByFileIdQuery, fileByUrlQuery } from "../../db/storage-queries";
import { getMd5FromChecksumsArray } from "../../db/helper";
import { groupBy, isEqual } from "lodash";
import {
  linkPedigreeWithDatasetCase,
  selectPedigreeByDatasetCaseIdAndDatasetUri,
  updatePedigreeMaternalRelationshipQuery,
  updatePedigreePaternalRelationshipQuery,
  updatePedigreeProbandAndDatasetPatientQuery,
} from "../../db/pedigree-queries";
import {
  insertNewDatasetCase,
  insertNewDatasetPatient,
  insertNewDatasetSpecimen,
  linkDatasetCaseWithDatasetPatient,
  linkDatasetPatientWithDatasetSpecimen,
  linkDatasetWithDatasetCase,
  linkNewArtifactWithDatasetSpecimen,
  selectDatasetCaseByExternalIdAndDatasetUriQuery,
  selectDatasetIdByDatasetUri,
  selectDatasetPatientByExternalIdAndDatasetUriQuery,
  selectDatasetSpecimen,
  updateDatasetPatientSex,
} from "../../db/dataset-queries";
import { DatasetService } from "../dataset-service";
import { dataset } from "../../../../dbschema/interfaces";
import { AuthenticatedUser } from "../../authenticated-user";
import { AuditEventService } from "../audit-event-service";
import { NotAuthorisedRefreshDatasetIndex } from "../../exceptions/dataset-authorisation";
import phenopackets from "../../../generated/phenopackets";
import { Logger } from "pino";
import { UserData } from "../../data/user-data";
import { DatasetAustralianGenomicsDirectories } from "../../../config/config-schema-dataset";
import { parse } from "papaparse";

type PhenopacketIndividiual =
  phenopackets.org.phenopackets.schema.v2.IPhenopacket;
type PhenopacketFamily = phenopackets.org.phenopackets.schema.v2.IFamily;
type PhenopacketCohort = phenopackets.org.phenopackets.schema.v2.ICohort;

/**
 * Manifest Type as what current AG manifest data will look like
 */

export type ManifestType = {
  // these TSV manifest fields are required and known
  checksum: string;
  agha_study_id_array: string[];
  s3Url: string;

  // we can also bring in a set of other fields from the source TSV
  [key: string]: any;
};

export type MergedManifestMetadataType = ManifestType & S3ObjectMetadataType;

export type FileGroupType = {
  // we allow phenopacket files - even though we don't support them yet as artifacts in the dataset
  // instead we use them to guide the dataset construction
  // for the types of phenopackets see https://phenopacket-schema.readthedocs.io/en/latest/toplevel.html
  filetype:
    | ArtifactEnum
    | "PHENOPACKET_INDIVIDUAL"
    | "PHENOPACKET_FAMILY"
    | "PHENOPACKET_COHORT";
  filenameId: string;
  specimenId: string;
  patientIdArray: string[];
  file: MergedManifestMetadataType[];
};

export type LabArtifactType = { sampleIdsArray: string[] } & File;
export type S3ManifestDictType = Record<string, ManifestType>;

@injectable()
export class S3IndexApplicationService {
  constructor(
    @inject("S3Client") private readonly s3Client: S3Client,
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Logger") private readonly logger: Logger,
    @inject(DatasetService) private readonly datasetService: DatasetService,
    @inject(AuditEventService)
    private readonly auditLogService: AuditEventService,
    @inject(UserData) private readonly userData: UserData
  ) {}

  /**
   * Auth check
   * @param user
   * @param datasetUri
   * @returns
   */
  private async checkIsImportDatasetAllowed(
    user: AuthenticatedUser,
    datasetUri?: string
  ): Promise<void> {
    const dbUser = await this.userData.getDbUser(this.edgeDbClient, user);

    if (!dbUser.isAllowedRefreshDatasetIndex)
      throw new NotAuthorisedRefreshDatasetIndex();
  }

  /**
   * @param s3UrlPrefix Prefix to search
   * @returns A list of S3 object metadata for AG bucket matching key prefix
   */
  async getS3ObjectListFromUriPrefix(
    s3UrlPrefix: string
  ): Promise<S3ObjectMetadataType[]> {
    return await awsListObjects(this.s3Client, s3UrlPrefix);
  }

  /**
   * @param s3ListMetadata
   * @param manifestEndsWith identifies manifests as those that end with this string
   * @returns A list of manifest string
   */
  getManifestUriFromS3ObjectList(
    s3ListMetadata: S3ObjectMetadataType[],
    manifestEndsWith: string
  ): string[] {
    const manifestKeys: string[] = [];
    for (const s3Metadata of s3ListMetadata) {
      if (s3Metadata.s3Url.endsWith(manifestEndsWith)) {
        manifestKeys.push(s3Metadata.s3Url);
      }
    }
    return manifestKeys;
  }

  /**
   * Merging metadata gotten from the manifest file uploaded (study_id, md5) with the metadata gotten from AWS (s3Url, size, eTag).
   * @param manifestList A list of parsed manifest file uploaded in the bucket.
   * @param s3ObjectMetadataTypeList
   * @returns A merge between parameters.
   */
  mergeObjectMetadata(
    manifestList: ManifestType[],
    s3ObjectMetadataTypeList: S3ObjectMetadataType[]
  ): MergedManifestMetadataType[] {
    const result: MergedManifestMetadataType[] = [];

    const s3MetadataDict: Record<string, S3ObjectMetadataType> = {};
    for (const s3Metadata of s3ObjectMetadataTypeList) {
      s3MetadataDict[s3Metadata.s3Url] = s3Metadata;
    }
    for (const manifestRecord of manifestList) {
      const s3Url = manifestRecord.s3Url;

      if (!s3MetadataDict[s3Url]) {
        console.log(`No File found (${s3Url})`);
        continue;
      }
      result.push({
        ...s3MetadataDict[s3Url],
        ...manifestRecord,
      });
    }

    return result;
  }

  /**
   * From a list of objects stored in the backend for a dataset, reads all the manifest
   * entries and decomposes them into objects.
   *
   * @param config
   * @param allObjects
   * @param loadText
   */
  async getS3ManifestObjectListFromAllObjectList(
    config: DatasetAustralianGenomicsDirectories,
    allObjects: S3ObjectMetadataType[],
    loadText: (url: string) => Promise<string>
  ): Promise<S3ManifestDictType> {
    const s3UrlManifestObj: S3ManifestDictType = {};

    const manifestUriList = this.getManifestUriFromS3ObjectList(
      allObjects,
      config.manifestEndsWith
    );

    for (const manifestS3Url of manifestUriList) {
      const manifestTsvContent = await loadText(manifestS3Url);

      const manifestObjContentList = parse<{
        checksum: string;
        agha_study_id: string;
        filename: string;
      }>(manifestTsvContent, {
        header: true,
        skipEmptyLines: true,
      });

      if (
        manifestObjContentList.errors &&
        manifestObjContentList.errors.length > 0
      ) {
        throw new Error(
          `Error ${manifestObjContentList.errors[0].message} parsing manifest file ${manifestS3Url}`
        );
      }

      // The manifest will contain a filename only, but for the purpose of uniqueness and how we stored in db.
      // We would append the filename with the s3 Url prefix.
      const manifestLastSlashIndex = manifestS3Url.lastIndexOf("/");
      const manifestS3UrlPrefix = manifestS3Url.substring(
        0,
        manifestLastSlashIndex
      );
      for (const manifestObj of manifestObjContentList.data) {
        const s3Url = `${manifestS3UrlPrefix}/${manifestObj.filename}`;
        s3UrlManifestObj[s3Url] = {
          s3Url: s3Url,
          agha_study_id_array: manifestObj.agha_study_id.split(","),
          ...manifestObj,
        };
      }
    }
    return s3UrlManifestObj;
  }

  /**
   * Grouping manifest files based on filetype
   *
   * @param manifestArray an array of the manifests from files
   * @param regexSpecimenId a regex that could be applied on files to determine specimen id
   * @param columnNameSpecimenId a column name that might be present in the manifests to set the specimen id
   * @returns FileGroupType
   * e.g.
   * {
   *   filetype: ArtifactEnum.FASTQ,
   *   specimenId: "0W0001",
   *   patientIdArray: ["A001"],
   *   file: [manifest1, manifest2]
   * }
   *
   */
  filetypeGrouping(
    manifestArray: MergedManifestMetadataType[],
    regexSpecimenId?: string,
    columnNameSpecimenId?: string
  ): FileGroupType[] {
    const result: FileGroupType[] = [];

    // take all the passed in files and group them by the "base" of their filenames
    // (this helps join indexes in with their primary data, joins fastq pairs together etc)
    const groupedByFilenameBase: Record<string, MergedManifestMetadataType[]> =
      groupBy(manifestArray, (manifest: MergedManifestMetadataType) => {
        // Removing index/compressed extension to find base filename.
        const filename = manifest.s3Url.replaceAll(
          /\.gz|\.tbi|\.bai|\.crai/g,
          ""
        );

        return filename.endsWith(".fastq") || filename.endsWith(".fq")
          ? filename.replaceAll(/_R1|_R2|\.R1|\.R2/g, "")
          : filename;
      });

    for (const [filenameBase, manifestGroupedArray] of Object.entries(
      groupedByFilenameBase
    )) {
      const filetype =
        filenameBase.endsWith(".fastq") || filenameBase.endsWith(".fq")
          ? ArtifactEnum.FASTQ
          : filenameBase.endsWith(".bam") || filenameBase.endsWith(".bai")
          ? ArtifactEnum.BAM
          : filenameBase.endsWith(".vcf") ||
            filenameBase.endsWith(".gvcf") ||
            filenameBase.endsWith(".tbi")
          ? ArtifactEnum.VCF
          : filenameBase.endsWith(".cram") || filenameBase.endsWith(".crai")
          ? ArtifactEnum.CRAM
          : filenameBase.endsWith(".phenopacket.json")
          ? "PHENOPACKET_INDIVIDUAL"
          : filenameBase.endsWith(".family.json")
          ? "PHENOPACKET_FAMILY"
          : filenameBase.endsWith(".cohort.json")
          ? "PHENOPACKET_COHORT"
          : undefined;

      // The context of agha_study_id is actually the patient Id
      const patientIdArray = manifestGroupedArray[0].agha_study_id_array;

      // Will find specimenId based on regex (if provided) from the filename
      // If regex not provided, will use patientId instead

      let specimenId = patientIdArray.join(",");

      if (regexSpecimenId) {
        const reMatchSpecimenId = filenameBase.match(regexSpecimenId);
        if (reMatchSpecimenId) specimenId = reMatchSpecimenId[1];
      }

      if (columnNameSpecimenId) {
        const manifestSpecimenId =
          manifestGroupedArray[0][columnNameSpecimenId];
        if (manifestSpecimenId) specimenId = manifestSpecimenId;
      }

      if (!filetype) {
        this.logger.warn("No matching Artifact Type");
        continue;
      }

      result.push({
        filetype,
        filenameId: filenameBase,
        specimenId,
        patientIdArray,
        file: manifestGroupedArray,
      });
    }

    return result;
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
   * Will create an insert artifact based on the grouped manifest details
   * (Each filetypes have different artifact Type)
   * @param groupManifest
   */
  insertArtifact(groupManifest: FileGroupType) {
    /**
     * Sorting url function to identify which is forward/reversed/indexed file
     * Index 0 is Forward file or base file
     * Index 1 is Reverse file or index file
     */
    const sortManifestFile = (artifactSet: MergedManifestMetadataType[]) =>
      artifactSet.sort((a, b) =>
        a.s3Url.toLowerCase() > b.s3Url.toLowerCase() ? 1 : -1
      );
    const manifestSet = sortManifestFile(groupManifest.file);

    const baseFile = this.convertManifestToStorageFileType(manifestSet[0]);

    // as our only file types that are individual file - and also incidentally doesn't get inserted into the dataset -
    // we do some seperate logic for phenopackets
    if (
      groupManifest.filetype === "PHENOPACKET_INDIVIDUAL" ||
      groupManifest.filetype === "PHENOPACKET_FAMILY" ||
      groupManifest.filetype === "PHENOPACKET_COHORT"
    ) {
      return undefined;
    }

    if (manifestSet.length <= 1) {
      throw new Error(
        `Dataset import encountered only a single file with base ${groupManifest.filenameId} - but all our files should come in as pairs`
      );
    }

    const indexFile = this.convertManifestToStorageFileType(manifestSet[1]);

    switch (groupManifest.filetype) {
      case ArtifactEnum.FASTQ:
        return insertArtifactFastqPairQuery(baseFile, indexFile);
      case ArtifactEnum.VCF:
        return insertArtifactVcfQuery(
          baseFile,
          indexFile,
          groupManifest.patientIdArray
        );
      case ArtifactEnum.BAM:
        return insertArtifactBamQuery(baseFile, indexFile);
      case ArtifactEnum.CRAM:
        return insertArtifactCramQuery(baseFile, indexFile);
      default:
        throw new Error(
          `Attempt to insert artifact of unknown type ${groupManifest.filetype}`
        );
    }
  }

  /**
   * Convert the merged manifest to artifacts format
   * @param manifest
   * @returns
   */
  convertManifestToStorageFileType(
    manifest: MergedManifestMetadataType
  ): LabArtifactType {
    return {
      url: manifest.s3Url,
      size: manifest.size,
      checksums: [
        {
          type: "MD5",
          value: manifest.checksum,
        },
      ],
      sampleIdsArray: manifest.agha_study_id_array,
    };
  }

  /**
   * Convert manifest record to a File record as file Db is stored as file record.
   * @param manifestRecordList A list of ManifestType record
   * @param s3MetadataList An S3ObjectMetadataType list for the particular manifest. (This will populate the size value)
   * @returns
   */
  converts3ManifestTypeToArtifactTypeRecord(
    manifestRecordList: ManifestType[],
    s3MetadataList: S3ObjectMetadataType[]
  ): LabArtifactType[] {
    const result: LabArtifactType[] = [];

    const s3MetadataDict: Record<string, S3ObjectMetadataType> = {};
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

  async getDbManifestObjectListByDatasetId(
    datasetId: string
  ): Promise<S3ManifestDictType> {
    const s3UrlManifestObj: S3ManifestDictType = {};

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

    // Turning artifact records to ManifestType object
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
    manifestAlpha: S3ManifestDictType,
    manifestBeta: S3ManifestDictType
  ): ManifestType[] {
    const result: ManifestType[] = [];

    for (const key in manifestAlpha) {
      const valueAlpha = manifestAlpha[key];
      const valueBeta = manifestBeta[key];

      // Check if alpha exist in Beta
      if (!valueBeta) {
        result.push(valueAlpha);
        continue;
      }

      // Check if studyId in Alpha are the different
      const studyIdAlpha = valueAlpha["agha_study_id_array"];
      const studyIdBeta = valueBeta["agha_study_id_array"];
      if (!isEqual(studyIdAlpha, studyIdBeta)) {
        result.push(valueAlpha);
      }
    }
    return result;
  }

  /**
   *
   * @param newManifest
   * @param oldManifest
   * @returns The new ManifestType that needs to be corrected
   */
  checkDiffChecksumRecordBetweenManifestDict(
    newManifest: S3ManifestDictType,
    oldManifest: S3ManifestDictType
  ): ManifestType[] {
    const result: ManifestType[] = [];
    for (const key in newManifest) {
      const newVal = newManifest[key];
      const oldVal = oldManifest[key];

      if (!newVal || !oldVal) {
        continue;
      }

      // Check if alpha exist in Beta
      if (newVal["checksum"] != oldVal["checksum"]) {
        result.push({
          agha_study_id_array: newVal.agha_study_id_array,
          checksum: newVal.checksum,
          s3Url: newVal.s3Url,
        });
      }
    }
    return result;
  }

  async linkPedigreeRelationship(
    datasetUri: string,
    pedigreeList: {
      probandId: string;
      patientId: string;
      datasetCaseId: string;
    }[]
  ) {
    for (const pedigree of pedigreeList) {
      const { probandId, patientId, datasetCaseId } = pedigree;

      // SelectOrInsert pedigree
      let pedigreeUUID = (
        await selectPedigreeByDatasetCaseIdAndDatasetUri({
          datasetUri,
          datasetCaseId,
        }).run(this.edgeDbClient)
      )?.id;

      if (!pedigreeUUID) {
        pedigreeUUID = (
          await e.insert(e.pedigree.Pedigree, {}).run(this.edgeDbClient)
        ).id;

        await linkPedigreeWithDatasetCase({
          datasetCaseId,
          datasetUri,
          pedigreeUUID,
        }).run(this.edgeDbClient);
      }

      if (patientId.toLowerCase().endsWith("_mat")) {
        await updatePedigreeMaternalRelationshipQuery({
          datasetUri,
          pedigreeUUID: pedigreeUUID,
          probandId: probandId,
          maternalId: patientId,
        }).run(this.edgeDbClient);
      } else if (patientId.toLowerCase().endsWith("_pat")) {
        await updatePedigreePaternalRelationshipQuery({
          datasetUri,
          pedigreeUUID: pedigreeUUID,
          probandId: probandId,
          paternalId: patientId,
        }).run(this.edgeDbClient);
      } else {
        await updatePedigreeProbandAndDatasetPatientQuery({
          datasetUri,
          probandId: patientId,
          pedigreeUUID: pedigreeUUID,
        }).run(this.edgeDbClient);
      }
    }
  }

  /**
   * Synchronise database records for a dataset against the files/information
   * available from the relevant backend. For instance, for a dataset with files in
   * S3 this will read the directories in S3 and look for new or updated objects.
   *
   * @param datasetUri the URI that defines the dataset in the configuration
   * @param datasetConfig the configuration of this dataset
   */
  public async syncWithDatabaseFromDatasetUri(
    datasetUri: string,
    datasetConfig: DatasetAustralianGenomicsDirectories
  ) {
    // triggering a sync is limited to certain users
    // await this.checkIsImportDatasetAllowed(user, datasetUri);

    // TODO this should upset db dataset records to allow us to bootstrap datasets from config
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

    let s3MetadataList: S3ObjectMetadataType[];
    let s3ManifestTypeObjectDict: S3ManifestDictType;

    const s3UrlPrefix =
      this.datasetService.getStorageUriPrefixFromFromDatasetUri(datasetUri);

    if (!s3UrlPrefix) {
      console.warn("No Storage Dataset URI found.");
      return;
    }

    // Searching match prefix with data in S3 store bucket
    s3MetadataList = await this.getS3ObjectListFromUriPrefix(s3UrlPrefix);

    // Grab all ManifestType object from all manifest files in s3
    s3ManifestTypeObjectDict =
      await this.getS3ManifestObjectListFromAllObjectList(
        datasetConfig,
        s3MetadataList,
        (url: string) => {
          return readObjectToStringFromS3Url(this.s3Client, url);
        }
      );

    // Grab all ManifestType object from current edgedb (i.e all the artifacts for a dataset but represented
    // as they would have been in their original manifest)
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
      /**
       * Artifact live recursively under Dataset as follows.
       * Dataset -> DatasetCase -> DatasetPatient -> DatasetSpecimen -> Artifact
       * So there are 4 cases which artifact can be inserted appropriately
       *
       * 1. Artifact only - Exist: DatasetCase, DatasetPatient, DatasetSpecimen
       * 2. Artifact, DatasetSpecimen -  Exist: DatasetCase, DatasetPatient
       * 3. Artifact, DatasetSpecimen, DatasetPatient - Exist: DatasetCase
       * 4. Artifact, DatasetSpecimen, DatasetPatient, DatasetCase - Exist: None
       *
       */

      // Combine S3 Manifest metadata (study_id, md5) with S3 Object Metadata (etag, size)
      const fullManifest = this.mergeObjectMetadata(
        missingFileFromDb,
        s3MetadataList
      );

      //  Inserting a new artifact must be in a complete file set (e.g. you can't insert a BAM without BAI)
      //  For this reason all files need to be grouped based on filetype before the insertion process.
      const groupedManifestByFiletype = this.filetypeGrouping(
        fullManifest,
        datasetConfig?.specimenIdentifier?.pathRegex,
        datasetConfig?.specimenIdentifier?.manifestColumnName
      );

      // A patientId link array that will be used for linking new patient record
      const patientIdAndDataCaseIdLinkingArray = [];

      const phenopacketsFound: { [patientId: string]: PhenopacketIndividiual } =
        {};

      // If we do not find any existing datasetCase id from the regex (that matches against the filename) provided, we
      // would attempt to group with other studyId that have the same proband study Id (study Id prefix) and use the
      // caseId found on the other studyId.
      // e.g. the studyId A123 (do not have caseId) belongs to the same A123_mat and will use A123's caseId instead)
      //
      // Ref: https://github.com/elsa-data/elsa-data/issues/509

      // We will create a dictionary of probandId (which is the studyId prefix) to a preferred case id
      // (via a configurable process)
      // Any not put into this dictionary will force Elsa to try to make up a case id
      const probandIdMapCaseId: Record<string, string> = {};

      // custom case ids are only enabled via configuration
      if (datasetConfig.caseIdentifier) {
        // Need to loop through all studyId
        for (const m of groupedManifestByFiletype) {
          const patientIdArray = m.patientIdArray;
          const filenameId = m.filenameId;

          for (const patientId of patientIdArray) {
            const probandId = patientId.split("_")[0];

            // case ids might be able to be derived from the filenames
            if (datasetConfig.caseIdentifier.pathRegex) {
              // If this filename has a matching regex (for the caseId), we will store this value
              const reMatchCaseId = filenameId.match(
                datasetConfig.caseIdentifier.pathRegex
              );
              if (reMatchCaseId) {
                probandIdMapCaseId[probandId] = reMatchCaseId[1];
              }
            }

            // case ids can be specified as part of the manifest that came with the files
            if (datasetConfig.caseIdentifier.manifestColumnName) {
              for (const c of m.file) {
                if (datasetConfig.caseIdentifier.manifestColumnName in c)
                  probandIdMapCaseId[probandId] =
                    c[
                      datasetConfig.caseIdentifier.manifestColumnName
                    ].toString();
              }
            }
          }
        }
      }

      for (const groupedManifest of groupedManifestByFiletype) {
        // Parsing for easy access
        const patientIdArray = groupedManifest.patientIdArray;
        const specimenId = groupedManifest.specimenId;
        const filenameId = groupedManifest.filenameId;

        if (groupedManifest.filetype === "PHENOPACKET_INDIVIDUAL") {
          // we can load the content of the phenopacket and use it to inform other aspects
          const phenopacketString = await readObjectToStringFromS3Url(
            this.s3Client,
            groupedManifest.filenameId
          );
          const phenopacket: PhenopacketIndividiual =
            JSON.parse(phenopacketString);

          if (patientIdArray.length === 1) {
            phenopacketsFound[patientIdArray[0]] = phenopacket;
          } else {
            this.logger.info(
              `Found individual phenopacket but they matched to multiple patient ids`
            );
          }

          continue;
        } else if (groupedManifest.filetype === "PHENOPACKET_FAMILY") {
          throw new Error("Phenopacket family is not yet supported");
        } else if (groupedManifest.filetype === "PHENOPACKET_COHORT") {
          throw new Error("Phenopacket cohort is not yet supported");
        }

        // get the edgedb query to insert this
        const artifactInsertionQuery = this.insertArtifact(groupedManifest);

        if (!artifactInsertionQuery) {
          console.error(
            `File base ${groupedManifest.filenameId} was not of a type for insertion as an artifact so it has been skipped`
          );
          continue;
        }

        // Splitting patientId individually so each patient has its own record
        // Since DatasetPatient -> DatasetSpecimen is an exclusive constraint, each DatasetSpecimen must be unique to its patient
        for (const patientId of patientIdArray) {
          /**
           * (1) Only insert Artifact in the existence of datasetSpecimen
           */
          let datasetSpecimenUUID = (
            await selectDatasetSpecimen({
              exId: specimenId,
              patientId,
              datasetUri,
            }).run(this.edgeDbClient)
          )?.id;

          if (datasetSpecimenUUID) {
            await linkNewArtifactWithDatasetSpecimen(
              datasetSpecimenUUID,
              artifactInsertionQuery
            ).run(this.edgeDbClient);

            // Done and can proceed to the next one.
            continue;
          }

          /**
           * (2) Insert: Artifact, datasetSpecimen
           */
          datasetSpecimenUUID = (
            await insertNewDatasetSpecimen({
              exId: specimenId,
              insertArtifactQuery: artifactInsertionQuery,
            }).run(this.edgeDbClient)
          ).id;

          let datasetPatientUUID = (
            await selectDatasetPatientByExternalIdAndDatasetUriQuery({
              exId: patientId,
              datasetUri,
            }).run(this.edgeDbClient)
          )?.id;

          if (datasetPatientUUID) {
            await linkDatasetPatientWithDatasetSpecimen({
              datasetPatientUUID,
              datasetSpecimenUUID: datasetSpecimenUUID,
            }).run(this.edgeDbClient);

            // Done for this patientId, moving to next one to make sure each patient has a link to their specimen
            continue;
          }

          /**
           * (3) Insert: Artifact, datasetSpecimen, DatasetPatient
           */
          const sexAtBirth: dataset.SexAtBirthType | null = null;

          // we have disabled the sex detection here (that used filenames) - and instead rely on
          // their being phenopackets for each individual
          // patientId.endsWith(
          //  "_pat"
          //            ? "male"
          //  : patientId.endsWith("_mat")
          //  ? "female"
          //  : null;

          datasetPatientUUID = (
            await insertNewDatasetPatient({
              exId: patientId,
              sexAtBirth,
              datasetSpecimenUUID,
            }).run(this.edgeDbClient)
          ).id;

          // Grouping and passing this array for the pedigree relationship below.
          const probandId = patientId.split("_")[0];

          const matchedCaseId = probandIdMapCaseId[probandId];
          const datasetCaseId = matchedCaseId
            ? matchedCaseId
            : patientIdArray.join(",");

          patientIdAndDataCaseIdLinkingArray.push({
            probandId: probandId,
            datasetCaseId: datasetCaseId,
            patientId: patientId,
          });

          let datasetCaseUUID = (
            await selectDatasetCaseByExternalIdAndDatasetUriQuery({
              exId: datasetCaseId,
              datasetUri,
            }).run(this.edgeDbClient)
          )?.id;

          if (datasetCaseUUID) {
            await linkDatasetCaseWithDatasetPatient({
              datasetCaseUUID,
              datasetPatientUUID,
            }).run(this.edgeDbClient);

            // Continue to the next patientId, to make brand new patient has a link to their cases
            continue;
          }

          /**
           * (4) Insert: Artifact, datasetSpecimen, DatasetPatient, DatasetCase
           */
          // New datasetCase
          datasetCaseUUID = (
            await insertNewDatasetCase({
              exId: datasetCaseId,
              datasetPatientUUID,
            }).run(this.edgeDbClient)
          ).id;

          await linkDatasetWithDatasetCase({
            datasetCaseUUID,
            datasetUri,
          }).run(this.edgeDbClient);
        }
      }

      if (
        datasetConfig.pedigree &&
        datasetConfig.pedigree.usePatientIdentifierSuffixes
      ) {
        // Handling pedigree Linking
        // At this stage, all dataset::DatasetPatient record should already exist
        await this.linkPedigreeRelationship(
          datasetUri,
          patientIdAndDataCaseIdLinkingArray
        );
      }

      // by now everyone that should exist does exist... so we can take all the phenopackets we have
      // encountered and use them to set sex
      for (const [patientId, phenopacket] of Object.entries(
        phenopacketsFound
      )) {
        const datasetPatient =
          await selectDatasetPatientByExternalIdAndDatasetUriQuery({
            exId: patientId,
            datasetUri: datasetUri,
          }).run(this.edgeDbClient);

        if (datasetPatient) {
          // this is just for a simple mapping of sex - obviously once we get to more complex phenotypes
          // we'll need to put some sort of proper mapping engine thing here
          if (phenopacket?.subject?.sex?.toString() === "MALE")
            await updateDatasetPatientSex({
              datasetPatientUuid: datasetPatient.id,
              sexAtBirth: "male",
            }).run(this.edgeDbClient);

          if (phenopacket?.subject?.sex?.toString() === "FEMALE")
            await updateDatasetPatientSex({
              datasetPatientUuid: datasetPatient.id,
              sexAtBirth: "female",
            }).run(this.edgeDbClient);
        }
      }
    }

    const now = new Date();
    // Update last update on Dataset
    await this.datasetService.updateDatasetCurrentTimestamp(datasetId, now);

    // await this.auditLogService.insertSyncDatasetAuditEvent(
    //  user,
    //  datasetUri,
    //  now,
    //  this.edgeDbClient
    // );
  }
}
