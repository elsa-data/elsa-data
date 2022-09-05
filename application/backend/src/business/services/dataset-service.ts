import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { DatasetDeepType, DatasetLightType } from "@umccr/elsa-types";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable, singleton } from "tsyringe";
import { createPagedResult, PagedResult } from "../../api/api-pagination";
import { BadLimitOffset } from "../exceptions/bad-limit-offset";
import {
  datasetAllCountQuery,
  datasetAllSummaryQuery,
} from "../db/dataset-queries";

@injectable()
@singleton()
export class DatasetService {
  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
  ) {}

  /**
   * Return a paged result of datasets in summary form.
   *
   * @param user
   * @param limit
   * @param offset
   */
  public async getAll(
    user: AuthenticatedUser,
    limit: number,
    offset: number,
  ): Promise<PagedResult<DatasetLightType>> {
    if (limit <= 0 || offset < 0) throw new BadLimitOffset(limit, offset);

    // TODO: if we introduce any security model into dataset (i.e. at the moment
    // all data owners can see all datasets) - we need to add some filtering to these
    // queries
    const fullCount = await datasetAllCountQuery.run(this.edgeDbClient);

    const fullDatasets = await datasetAllSummaryQuery.run(this.edgeDbClient, {
      limit: limit,
      offset: offset,
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
        summaryCaseCount: fd.summaryCaseCount,
        summaryPatientCount: fd.summaryPatientCount,
        summarySpecimenCount: fd.summarySpecimenCount,
        summaryArtifactCount: fd.summaryArtifactCount,
        summaryArtifactIncludes: includes.join(" "),
        summaryArtifactSizeBytes: fd.summaryArtifactBytes,
      };
    });

    return createPagedResult(converted, fullCount, limit);
  }

  public async get(
    user: AuthenticatedUser,
    datasetId: string,
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

    if (singleDataset != null)
      return {
        id: singleDataset.id,
        uri: singleDataset.uri,
        description: singleDataset.description,
        summaryArtifactCount: 0,
        summaryArtifactIncludes: "",
        summaryCaseCount: 0,
        summarySpecimenCount: 0,
        summaryPatientCount: 0,
        summaryArtifactSizeBytes: 0,
        cases: singleDataset.cases.map((c) => {
          return {
            patients: c.patients.map((p) => {
              return {
                specimens: p.specimens.map((s) => {
                  return {
                    artifacts: [],
                  };
                }),
              };
            }),
          };
        }),
      };

    return null;
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
    offset: number,
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
}
