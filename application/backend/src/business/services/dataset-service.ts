import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import e from "../../../dbschema/edgeql-js";
import {
  DatasetDeepType,
  DatasetLightType,
  DuoLimitationCodedType,
} from "@umccr/elsa-types";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable, singleton } from "tsyringe";
import {
  createPagedResult,
  PagedResult,
} from "../../api/helpers/pagination-helpers";
import { BadLimitOffset } from "../exceptions/bad-limit-offset";
import { makeSystemlessIdentifierArray } from "../db/helper";
import {
  datasetAllCountQuery,
  datasetAllSummaryQuery,
  singleDatasetSummaryQuery,
  selectDatasetIdByDatasetUri,
} from "../db/dataset-queries";
import { ElsaSettings } from "../../config/elsa-settings";
import { AuditLogService } from "./audit-log-service";
import { NotAuthorisedViewDataset } from "../exceptions/dataset-authorisation";

@injectable()
export class DatasetService {
  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings,
    private readonly auditLogService: AuditLogService
  ) {}

  /**
   *
   * @param executor the EdgeDb execution context (either client or transaction)
   * @param user
   * @param releaseKey
   * @returns
   */
  private checkIsAllowedViewDataset(
    user: AuthenticatedUser,
    datasetUri?: string
  ): void {
    // Allowed to view dataset if allowed to createRelease, importDataset, viewReleases
    const isCreateReleaseAllow = user.isAllowedCreateRelease;
    const isAllowedRefreshDatasetIndex = user.isAllowedRefreshDatasetIndex;
    const isViewReleaseAllow = user.isAllowedOverallAdministratorView;

    console.log("user", user);
    if (
      isCreateReleaseAllow ||
      isAllowedRefreshDatasetIndex ||
      isViewReleaseAllow
    ) {
      return;
    }

    throw new NotAuthorisedViewDataset();
  }

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
   * Return a paged result of datasets in summary form.
   *
   * @param user
   * @param includeDeletedFile
   * @param limit
   * @param offset
   */
  public async getSummary(
    user: AuthenticatedUser,
    includeDeletedFile: boolean,
    limit?: number,
    offset?: number
  ): Promise<PagedResult<DatasetLightType>> {
    this.checkIsAllowedViewDataset(user);

    if (
      (limit !== undefined && limit <= 0) ||
      (offset !== undefined && offset < 0)
    )
      throw new BadLimitOffset(limit, offset);

    // TODO: if we introduce any security model into dataset (i.e. at the moment
    // all administrators can see all datasets) - we need to add some filtering to these
    // queries
    const fullCount = await datasetAllCountQuery.run(this.edgeDbClient);
    const fullDatasets = await datasetAllSummaryQuery.run(this.edgeDbClient, {
      ...(limit === undefined ? {} : { limit }),
      ...(offset === undefined ? {} : { offset }),
      includeDeletedFile: includeDeletedFile,
    });

    const converted: DatasetLightType[] = fullDatasets.map((fd: any) => {
      const includes: string[] = [];
      if (fd.summaryBamCount > 0) includes.push("BAM");
      if (fd.summaryBclCount > 0) includes.push("BCL");
      if (fd.summaryCramCount > 0) includes.push("CRAM");
      if (fd.summaryFastqCount > 0) includes.push("FASTQ");
      if (fd.summaryVcfCount > 0) includes.push("VCF");
      return {
        id: fd.id,
        uri: fd.uri!,
        description: fd.description,
        updatedDateTime: fd.updatedDateTime,
        isInConfig: fd.isInConfig,
        summaryCaseCount: fd.summaryCaseCount,
        summaryPatientCount: fd.summaryPatientCount,
        summarySpecimenCount: fd.summarySpecimenCount,
        summaryArtifactCount: fd.summaryArtifactCount,
        summaryArtifactIncludes: includes.join(" "),
        summaryArtifactSizeBytes: fd.summaryArtifactBytes,
      };
    });

    return createPagedResult(converted, fullCount);
  }

  public async get(
    user: AuthenticatedUser,
    datasetId: string
  ): Promise<DatasetDeepType | null> {
    this.checkIsAllowedViewDataset(user);

    const sd = await singleDatasetSummaryQuery.run(this.edgeDbClient, {
      includeDeletedFile: false,
      datasetId: datasetId,
    });

    if (sd) {
      const includes: string[] = [];
      if (sd.summaryBamCount > 0) includes.push("BAM");
      if (sd.summaryBclCount > 0) includes.push("BCL");
      if (sd.summaryCramCount > 0) includes.push("CRAM");
      if (sd.summaryFastqCount > 0) includes.push("FASTQ");
      if (sd.summaryVcfCount > 0) includes.push("VCF");
      return {
        id: sd.id,
        uri: sd.uri,
        updatedDateTime: sd.updatedDateTime,
        isInConfig: sd.isInConfig,
        description: sd.description,
        summaryCaseCount: sd.summaryCaseCount,
        summaryPatientCount: sd.summaryPatientCount,
        summarySpecimenCount: sd.summarySpecimenCount,
        summaryArtifactCount: sd.summaryArtifactCount,
        summaryArtifactIncludes: includes.join(" "),
        summaryArtifactSizeBytes: sd.summaryArtifactBytes,
        cases: sd.cases,
      };
    }

    return sd;
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
    // With this, all consent in Db is accessible if user had access to view all datasets.
    this.checkIsAllowedViewDataset(user);

    const consentQuery = e
      .select(e.consent.Consent, (c) => ({
        id: true,
        statements: {
          ...e.is(e.consent.ConsentStatementDuo, { dataUseLimitation: true }),
        },
        filter: e.op(c.id, "=", e.uuid(consentId)),
      }))
      .assert_single();

    const consent = await consentQuery.run(this.edgeDbClient);

    if (!consent) return [];

    return consent.statements.map(
      (stmt) => stmt.dataUseLimitation as DuoLimitationCodedType
    );
  }
}
