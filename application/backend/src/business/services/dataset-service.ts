import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import {
  DatasetDeepType,
  DatasetLightType,
  DuoLimitationCodedType,
} from "@umccr/elsa-types";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable } from "tsyringe";
import {
  createPagedResult,
  PagedResult,
} from "../../api/helpers/pagination-helpers";
import { makeSystemlessIdentifierArray } from "../db/helper";
import { selectDatasetIdByDatasetUri } from "../db/dataset-queries";
import { ElsaSettings } from "../../config/elsa-settings";
import { AuditLogService } from "./audit-log-service";
import {
  getAllDataset,
  getDatasetConsent,
  getDatasetCasesByUri,
  getDatasetStorageStatsByUri,
} from "../../../dbschema/queries";

@injectable()
export class DatasetService {
  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject(AuditLogService) private readonly auditLogService: AuditLogService
  ) {}

  /**
   * Get Storage URI Prefix from dataset URI
   * @param datasetUri
   * @returns
   */
  public getStorageUriPrefixFromFromDatasetUri(
    datasetUri: string
  ): string | null {
    for (const d of this.settings.datasets) {
      if (d.uri === datasetUri) {
        return d.storageUriPrefix;
      }
    }

    return null;
  }

  /**
   *
   * @param releaseKey
   * @returns
   */
  public async getDatasetUrisFromReleaseKey(
    releaseKey: string
  ): Promise<string[] | undefined> {
    return (
      await e
        .select(e.release.Release, (r) => ({
          filter: e.op(r.releaseKey, "=", releaseKey),
          datasetUris: true,
        }))
        .assert_single()
        .run(this.edgeDbClient)
    )?.datasetUris;
  }

  /**
   * Return a dictionary of the datasets that are configured in this instance of Elsa
   * and their corresponding name. This is functionality that is available to
   * all users.
   *
   * @param user
   */
  public async getConfigured(user: AuthenticatedUser) {
    return Object.fromEntries(
      this.settings.datasets.map((a) => [a.uri, a.name])
    );
  }

  /**
   * Return a paged result of datasets.
   *
   * @param user
   * @param limit
   * @param offset
   */
  public async getAll({
    user,
    limit,
    offset,
  }: {
    user: AuthenticatedUser;
    limit: number;
    offset: number;
  }): Promise<PagedResult<DatasetLightType>> {
    const datasetSummaryQuery = await getAllDataset(this.edgeDbClient, {
      userDbId: user.dbId,
      limit,
      offset,
    });

    return createPagedResult(
      datasetSummaryQuery.data.map((r) => ({
        uri: r.uri,
        description: r.description,
        updatedDateTime: r.updatedDateTime,
        isInConfig: r.isInConfig,
      })),
      datasetSummaryQuery.total
    );
  }

  public async get({
    user,
    datasetUri,
    includeDeletedFile,
  }: {
    user: AuthenticatedUser;
    datasetUri: string;
    includeDeletedFile: boolean;
  }): Promise<DatasetDeepType | null> {
    const datasetCasesQuery = await getDatasetCasesByUri(this.edgeDbClient, {
      userDbId: user.dbId,
      datasetUri: datasetUri,
    });
    const datasetStorageStatsQuery = await getDatasetStorageStatsByUri(
      this.edgeDbClient,
      {
        userDbId: user.dbId,
        datasetUri: datasetUri,
        includeDeletedFile,
      }
    );

    if (!datasetCasesQuery || !datasetStorageStatsQuery) return null;

    return {
      uri: datasetCasesQuery.uri,
      description: datasetCasesQuery.description,
      updatedDateTime: datasetCasesQuery.updatedDateTime,
      isInConfig: datasetCasesQuery.isInConfig,
      totalCaseCount: datasetCasesQuery.totalCaseCount,
      totalPatientCount: datasetCasesQuery.totalPatientCount,
      totalSpecimenCount: datasetCasesQuery.totalSpecimenCount,
      cases: datasetCasesQuery.cases,

      // Artifact Type Count
      totalArtifactCount: datasetStorageStatsQuery.totalArtifactCount,
      totalArtifactSizeBytes: datasetStorageStatsQuery.totalArtifactSizeBytes,
      bclCount: datasetStorageStatsQuery.bclCount,
      fastqCount: datasetStorageStatsQuery.fastqCount,
      vcfCount: datasetStorageStatsQuery.vcfCount,
      bamCount: datasetStorageStatsQuery.bamCount,
      cramCount: datasetStorageStatsQuery.cramCount,
    };
  }

  /**
   * Get all the cases for a dataset
   *
   * @param user
   * @param datasetId
   * @param limit
   * @param offset
   */
  public async getCases(
    user: AuthenticatedUser,
    datasetId: string,
    limit: number,
    offset: number
  ): Promise<any | null> {
    const pageCases = await e
      .select(e.dataset.DatasetCase, (dsc) => ({
        ...e.dataset.DatasetCase["*"],
        externalIdentifiers: true,
        patients: {
          externalIdentifiers: true,
          specimens: {
            externalIdentifiers: true,
          },
        },
        filter: e.op(dsc.dataset.id, "=", e.uuid(datasetId)),
        limit: e.int32(limit),
        offset: e.int32(offset),
      }))
      .run(this.edgeDbClient);

    return pageCases;
  }

  /**
   * Select or insert new dataset if doesn't exist in Db
   * Optionally add a UserAuditEvent if a user parameter is supplied.
   * @returns Dataset Id
   */
  public async selectOrInsertDataset(
    {
      datasetUri,
      datasetDescription,
      datasetName,
    }: {
      datasetUri: string;
      datasetDescription: string;
      datasetName: string;
    },
    user?: AuthenticatedUser
  ): Promise<string> {
    // Find current Dataset
    const datasetId = (
      await selectDatasetIdByDatasetUri(datasetUri).run(this.edgeDbClient)
    )?.id;
    if (datasetId) return datasetId;

    // Else, create new dataset
    return await this.edgeDbClient.transaction(async (tx) => {
      const insertDatasetQuery = e.insert(e.dataset.Dataset, {
        uri: datasetUri,
        externalIdentifiers: makeSystemlessIdentifierArray(datasetName),
        description: datasetDescription,
      });

      const newDataset = await insertDatasetQuery.run(tx);

      if (user !== undefined) {
        await this.auditLogService.insertAddDatasetAuditEvent(
          tx,
          user,
          datasetUri
        );
      }

      return newDataset.id;
    });
  }

  /**
   * Select dataset from datasetUri
   */
  public async selectDatasetIdFromDatasetUri(
    datasetUri: string
  ): Promise<string | null> {
    const datasetId = (
      await selectDatasetIdByDatasetUri(datasetUri).run(this.edgeDbClient)
    )?.id;
    if (datasetId) return datasetId;

    return null;
  }

  /**
   * Delete given dataset URI from database.
   * Optionally add a UserAuditEvent if a user parameter is supplied.
   * @returns DatasetId
   */
  public async deleteDataset(
    {
      datasetUri,
    }: {
      datasetUri: string;
    },
    user?: AuthenticatedUser
  ): Promise<string | undefined> {
    return await this.edgeDbClient.transaction(async (tx) => {
      const deleteDataset = e
        .delete(e.dataset.Dataset, (d) => ({
          filter: e.op(d.uri, "=", datasetUri),
        }))
        .assert_single();

      const datasetDeleted = await deleteDataset.run(tx);

      if (user !== undefined) {
        await this.auditLogService.insertDeleteDatasetAuditEvent(
          tx,
          user,
          datasetUri
        );
      }

      return datasetDeleted?.id;
    });
  }

  public async configureDataset(
    datasetConfigArray: ({
      uri: string;
      description: string;
      name: string;
    } & Record<string, any>)[]
  ): Promise<void> {
    // Insert new dataset
    for (const dc of datasetConfigArray) {
      await this.selectOrInsertDataset({
        datasetDescription: dc.description,
        datasetName: dc.name,
        datasetUri: dc.uri,
      });
    }

    // Mark for dataset no longer in config file
    const currentDbUriArr = (
      await e
        .select(e.dataset.Dataset, () => ({ uri: true }))
        .run(this.edgeDbClient)
    ).map((x) => x.uri);
    const missingDatasetFromConfig = currentDbUriArr.filter((dbUri) => {
      for (const dc of datasetConfigArray) {
        if (dc.uri == dbUri) return false;
      }
      return true;
    });
    for (const md of missingDatasetFromConfig) {
      await e
        .update(e.dataset.Dataset, (d) => ({
          filter: e.op(d.uri, "=", md).assert_single(),
          set: {
            isInConfig: false,
          },
        }))
        .run(this.edgeDbClient);
    }
  }

  public async updateDatasetCurrentTimestamp(datasetId: string, date?: Date) {
    await e
      .update(e.dataset.Dataset, (d) => ({
        filter: e.op(d.id, "=", e.uuid(datasetId)).assert_single(),
        set: {
          updatedDateTime: date ?? new Date(),
        },
      }))
      .run(this.edgeDbClient);
  }

  public async getDatasetsConsent(
    user: AuthenticatedUser,
    consentId: string
  ): Promise<DuoLimitationCodedType[]> {
    const consent = await getDatasetConsent(this.edgeDbClient, {
      userDbId: user.dbId,
      consentDbId: consentId,
    });

    if (!consent) return [];

    return consent.statements.map(
      (stmt) => stmt.dataUseLimitation as DuoLimitationCodedType
    );
  }
}
