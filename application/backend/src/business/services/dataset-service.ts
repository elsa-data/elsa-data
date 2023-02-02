import * as edgedb from "edgedb";
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
  selectOrUpsertDataset,
} from "../db/dataset-queries";
import { ElsaSettings } from "../../config/elsa-settings";
import {
  doOwnerRoleInConsentCheck,
  doOwnerRoleInDatasetCheck,
} from "./helpers";

@injectable()
@singleton()
export class DatasetService {
  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings
  ) {}

  /* ********************************
   * API Service functions
   * ******************************** /

  /**
   * Get detailed consent from consentId
   * @param user
   * @param consentId
   * @returns
   */
  public async getDatasetsConsent(
    user: AuthenticatedUser,
    consentId: string
  ): Promise<DuoLimitationCodedType[]> {
    const { authUser } = await doOwnerRoleInConsentCheck(this, user, consentId);

    const consentQuery: any = e
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
      (stmt: any) => stmt.dataUseLimitation as DuoLimitationCodedType
    );
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
    includeDeletedFile: boolean,
    limit?: number,
    offset?: number
  ): Promise<PagedResult<DatasetLightType>> {
    if (
      (limit !== undefined && limit <= 0) ||
      (offset !== undefined && offset < 0)
    )
      throw new BadLimitOffset(limit, offset);

    const authEmail = user.email;
    const fullCount = await datasetAllCountQuery.run(this.edgeDbClient, {
      authEmail,
    });
    const fullDatasets = await datasetAllSummaryQuery.run(this.edgeDbClient, {
      ...(limit === undefined ? {} : { limit }),
      ...(offset === undefined ? {} : { offset }),
      includeDeletedFile: includeDeletedFile,
      authEmail: authEmail,
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
    const { authUser } = await doOwnerRoleInDatasetCheck(this, user, datasetId);

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
    const { authUser } = await doOwnerRoleInDatasetCheck(this, user, datasetId);

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
  public async configureDataset(
    datasetConfigArray: ({
      uri: string;
      description: string;
      name: string;
      dataOwnerEmailArray?: string[];
    } & Record<string, any>)[]
  ): Promise<void> {
    // Insert new dataset
    for (const dc of datasetConfigArray) {
      await selectOrUpsertDataset({
        datasetDescription: dc.description,
        datasetName: dc.name,
        datasetUri: dc.uri,
        dataOwnerEmailArray: dc.dataOwnerEmailArray,
      }).run(this.edgeDbClient);
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

  /**
   * Helper Functions
   */

  async getDatasetIdFromDatasetUri(
    datasetUri: string
  ): Promise<string | undefined> {
    return (
      await selectDatasetIdByDatasetUri(datasetUri).run(this.edgeDbClient)
    )?.id;
  }

  /**
   * Grab storage prefix for a given datasetUri. (e.g. Prefix of AWS storage from the datasetURI)
   * @param datasetUri
   * @returns
   */
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

  /* ********************************
   * Dataset auth checking functions
   * ******************************** */

  /**
   * Check if datasetId own by the user given
   * @param user
   * @param datasetId
   * @returns
   */
  public async isUserOwnerOfDatasetId(
    user: AuthenticatedUser,
    datasetId: string
  ): Promise<boolean> {
    const dataOwnerEmailArray = (
      await e
        .select(e.dataset.Dataset, (d) => ({
          dataOwnerEmailArray: true,
          filter: e.op(e.uuid(datasetId), "=", d.id),
        }))
        .assert_single()
        .run(this.edgeDbClient)
    )?.dataOwnerEmailArray;

    if (dataOwnerEmailArray)
      for (const e of dataOwnerEmailArray) {
        if (user.email == e) {
          return true;
        }
      }

    return false;
  }

  /**
   * Return datasetId if consentId belongs to a dataset
   * @param consentId
   * @returns
   */
  public async getDatasetIdFromConsentId(
    consentId: string
  ): Promise<string | undefined> {
    const datasetIdQuery = e
      .select(e.dataset.Dataset, (d) => {
        // ConsentId can be from Dataset, DatasetCase, DatasetPatient, or DatasetSpecimen
        const dQ = e.op(d.consent.id, "=", e.uuid(consentId));
        const dCaseQ = e.op(d.cases.consent.id, "=", e.uuid(consentId));
        const dPatientQ = e.op(
          d.cases.patients.consent.id,
          "=",
          e.uuid(consentId)
        );
        const dSpecimensQ = e.op(
          d.cases.patients.specimens.consent.id,
          "=",
          e.uuid(consentId)
        );

        // Filter in logic expression: (dQ V dCaseQ) V (dPatientQ V dSpecimensQ)
        return {
          id: true,
          filter: e.op(
            e.op(dQ, "or", dCaseQ),
            "or",
            e.op(dPatientQ, "or", dSpecimensQ)
          ),
        };
      })
      .assert_single();

    return (await datasetIdQuery.run(this.edgeDbClient))?.id;
  }
}
