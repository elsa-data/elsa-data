import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { DatasetDeepType, DatasetLightType } from "@umccr/elsa-types";
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
  datasetSummaryQuery,
  selectDatasetIdByDatasetUri,
} from "../db/dataset-queries";
import { ElsaSettings } from "../../config/elsa-settings";

@injectable()
@singleton()
export class DatasetService {
  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings
  ) {}

  getUriPrefixFromFromDatasetUri(datasetUri: string): string | null {
    for (const d of this.settings.datasets) {
      if (d.uri === datasetUri) {
        return d.storageUriPrefix;
      }
    }

    return null;
  }

  async getDatasetUrisFromReleaseId(
    releaseId: string
  ): Promise<string[] | undefined> {
    return (
      await e
        .select(e.release.Release, (r) => ({
          filter: e.op(r.id, "=", e.uuid(releaseId)),
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
   * @param limit
   * @param offset
   */
  public async getSummary(
    user: AuthenticatedUser,
    limit: number,
    offset: number,
    includeDeletedFile: boolean
  ): Promise<PagedResult<DatasetLightType>> {
    if (limit <= 0 || offset < 0) throw new BadLimitOffset(limit, offset);

    // TODO: if we introduce any security model into dataset (i.e. at the moment
    // all data owners can see all datasets) - we need to add some filtering to these
    // queries
    const fullCount = await datasetAllCountQuery.run(this.edgeDbClient);
    const fullDatasets = await datasetSummaryQuery.run(this.edgeDbClient, {
      limit: limit,
      offset: offset,
      includeDeletedFile: includeDeletedFile,
    });

    const converted: DatasetLightType[] = fullDatasets.map((fd) => {
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
    const singleDataset = await e
      .select(e.dataset.Dataset, (ds) => ({
        ...e.dataset.Dataset["*"],
        summaryArtifactBytes: e.int16(0),
        //e.sum(
        //  ds.cases.patients.specimens.artifacts.is(e.lab.AnalysesArtifactBase).
        //),
        cases: {
          externalIdentifiers: true,
          patients: {
            externalIdentifiers: true,
            specimens: {
              externalIdentifiers: true,
            },
          },
        },
        filter: e.op(ds.id, "=", e.uuid(datasetId)),
      }))
      .run(this.edgeDbClient);

    if (singleDataset != null) {
      return {
        id: singleDataset.id,
        uri: singleDataset.uri,
        updatedDateTime: singleDataset.updatedDateTime,
        isInConfig: singleDataset.isInConfig,
        description: singleDataset.description,
        summaryArtifactCount: 0,
        summaryArtifactIncludes: "",
        summaryCaseCount: 0,
        summarySpecimenCount: 0,
        summaryPatientCount: 0,
        summaryArtifactSizeBytes: 0,
        cases: [],
      };
    }

    return singleDataset;
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
   * @returns Dataset Id
   */
  public async selectOrInsertDataset({
    datasetUri,
    datasetDescription,
    datasetName,
  }: {
    datasetUri: string;
    datasetDescription: string;
    datasetName: string;
  }): Promise<string> {
    // Find current Dataset
    const datasetId = (
      await selectDatasetIdByDatasetUri(datasetUri).run(this.edgeDbClient)
    )?.id;
    if (datasetId) return datasetId;

    // Else, create new dataset
    const insertDatasetQuery = e.insert(e.dataset.Dataset, {
      uri: datasetUri,
      externalIdentifiers: makeSystemlessIdentifierArray(datasetName),
      description: datasetDescription,
    });
    const newDataset = await insertDatasetQuery.run(this.edgeDbClient);
    return newDataset.id;
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
   * @returns DatasetId
   */
  public async deleteDataset({
    datasetUri,
  }: {
    datasetUri: string;
  }): Promise<string | undefined> {
    const deleteDataset = e
      .delete(e.dataset.Dataset, (d) => ({
        filter: e.op(d.uri, "=", datasetUri),
      }))
      .assert_single();

    const datasetDeleted = await deleteDataset.run(this.edgeDbClient);
    return datasetDeleted?.id;
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

  public async updateDatasetCurrentTimestamp(datasetId: string) {
    await e
      .update(e.dataset.Dataset, (d) => ({
        filter: e.op(d.id, "=", e.uuid(datasetId)).assert_single(),
        set: {
          updatedDateTime: new Date(),
        },
      }))
      .run(this.edgeDbClient);
  }
}
