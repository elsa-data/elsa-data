import * as edgedb from "edgedb";
import e, { dataset } from "../../../dbschema/edgeql-js";
import {
  DatasetDeepType,
  ReleaseCaseType,
  ReleaseDatasetType,
  ReleaseNodeStatusType,
  ReleasePatientType,
  ReleaseSpecimenType,
  ReleaseType,
} from "@umccr/elsa-types";
import { usersService } from "./users";
import { AuthenticatedUser } from "../authenticated-user";
import { isSafeInteger } from "lodash";
import { createPagedResult, PagedResult } from "../../api/api-pagination";
import { doRoleInReleaseCheck, getReleaseInfo } from "./releases-helper";

class ReleasesService {
  private edgeDbClient = edgedb.createClient();

  public async getAll(user: AuthenticatedUser, limit: number, offset: number) {
    return {};
  }

  /**
   * Get a single release.
   *
   * @param user
   * @param releaseId
   */
  public async get(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<ReleaseType | null> {
    const { userRole } = await doRoleInReleaseCheck(user, releaseId);

    const thisRelease = await e
      .select(e.release.Release, (r) => ({
        ...e.release.Release["*"],
        filter: e.op(r.id, "=", e.uuid(releaseId)),
      }))
      .assert_single()
      .run(this.edgeDbClient);

    if (thisRelease != null)
      return {
        id: thisRelease.id,
        applicationCoded:
          thisRelease.applicationCoded != null
            ? JSON.parse(thisRelease.applicationCoded)
            : {},
        datasetUris: thisRelease.datasetUris,
        applicationDacDetails: thisRelease.applicationDacDetails!,
        applicationDacIdentifier: thisRelease.applicationDacIdentifier!,
        applicationDacTitle: thisRelease.applicationDacTitle!,
        // data owners can code/edit the release information
        permissionEditApplicationCoded: userRole === "DataOwner",
        permissionEditSelections: userRole === "DataOwner",
        // data owners cannot however access the raw data (if they want access to their data - they need to go other ways)
        permissionAccessData: userRole !== "DataOwner",
      };

    return null;
  }

  /**
   * Get all the cases for a release including checkbox status down to specimen level.
   *
   * Depending on the role of the user this will return different sets of cases.
   * (the admins will get all the cases, but researchers/pi will only see cases that they
   * have some level of visibility into)
   *
   * @param user
   * @param releaseId
   * @param limit
   * @param offset
   */
  public async getCases(
    user: AuthenticatedUser,
    releaseId: string,
    limit?: number,
    offset?: number
  ): Promise<PagedResult<ReleaseCaseType> | null> {
    const { userRole } = await doRoleInReleaseCheck(user, releaseId);

    const { selectedSpecimenIds, selectedSpecimenUuids, datasetUriToIdMap } =
      await getReleaseInfo(this.edgeDbClient, releaseId);

    const selectedSet =
      selectedSpecimenUuids.size > 0
        ? e.set(...selectedSpecimenUuids)
        : e.cast(e.uuid, e.set());

    const makeFilter = (dsc: any) => {
      return e.op(
        e.op(dsc.dataset.id, "in", e.set(...datasetUriToIdMap.values())),
        "and",
        e.op(
          e.bool(userRole === "DataOwner"),
          "or",
          e.op(dsc.patients.specimens.id, "in", selectedSet)
        )
      );
    };

    const caseSearchQuery = e.select(e.dataset.DatasetCase, (dsc) => ({
      ...e.dataset.DatasetCase["*"],
      dataset: {
        ...e.dataset.Dataset["*"],
      },
      patients: (p) => ({
        ...e.dataset.DatasetPatient["*"],
        filter: e.op(
          e.bool(userRole === "DataOwner"),
          "or",
          e.op(p.specimens.id, "in", selectedSet)
        ),
        specimens: (s) => ({
          ...e.dataset.DatasetSpecimen["*"],
          filter: e.op(
            e.bool(userRole === "DataOwner"),
            "or",
            e.op(s.id, "in", selectedSet)
          ),
        }),
      }),
      // our cases should only be those from the datasets of this release and those appropriate for the user
      filter: makeFilter(dsc),
      // paging
      limit: isSafeInteger(limit) ? e.int64(limit!) : undefined,
      offset: isSafeInteger(offset) ? e.int64(offset!) : undefined,
      order_by: [
        {
          expression: dsc.dataset.uri,
          direction: e.ASC,
        },
        {
          expression: dsc.id,
          direction: e.ASC,
        },
      ],
    }));

    const pageCases = await caseSearchQuery.run(this.edgeDbClient);

    // we need to construct the result hierarchies, including computing the checkbox at intermediate nodes

    if (!pageCases) return null;

    // basically the identical query as above but without limit/offset and counting the
    // total
    const caseCountQuery = e.count(
      e.select(e.dataset.DatasetCase, (dsc) => ({
        ...e.dataset.DatasetCase["*"],
        dataset: {
          ...e.dataset.Dataset["*"],
        },
        patients: {
          ...e.dataset.DatasetPatient["*"],
          specimens: {
            ...e.dataset.DatasetSpecimen["*"],
          },
        },
        filter: makeFilter(dsc),
      }))
    );

    const casesCount = await caseCountQuery.run(this.edgeDbClient);

    // given an array of children node-like structures, compute what our node status is
    // NOTE: this is entirely dependent on the Release node types to all have a `nodeStatus` field
    const calcNodeStatus = (
      nodes: { nodeStatus: ReleaseNodeStatusType }[]
    ): ReleaseNodeStatusType => {
      const isAllSelected = nodes.every((s) => s.nodeStatus === "selected");
      const isNoneSelected = nodes.every((s) => s.nodeStatus === "unselected");
      return (
        isAllSelected
          ? "selected"
          : isNoneSelected
          ? "unselected"
          : "indeterminate"
      ) as ReleaseNodeStatusType;
    };

    const collapseExternalIds = (externals: any): string => {
      if (!externals || externals.length < 1) return "<empty ids>";
      else return externals[0].value ?? "<empty id value>";
    };

    const createSpecimenMap = (
      spec: dataset.DatasetSpecimen
    ): ReleaseSpecimenType => {
      return {
        id: spec.id,
        externalId: collapseExternalIds(spec.externalIdentifiers),
        nodeStatus: (selectedSpecimenIds.has(spec.id)
          ? "selected"
          : "unselected") as ReleaseNodeStatusType,
      };
    };

    const createPatientMap = (
      pat: dataset.DatasetPatient
    ): ReleasePatientType => {
      const specimensMapped = Array.from<ReleaseSpecimenType>(
        pat.specimens.map(createSpecimenMap)
      );

      return {
        id: pat.id,
        sexAtBirth: pat?.sexAtBirth || undefined,
        externalId: collapseExternalIds(pat.externalIdentifiers),
        nodeStatus: calcNodeStatus(specimensMapped),
        specimens: specimensMapped,
      };
    };

    const createCaseMap = (cas: dataset.DatasetCase): ReleaseCaseType => {
      const patientsMapped = Array.from<ReleasePatientType>(
        cas.patients.map(createPatientMap)
      );

      return {
        id: cas.id,
        externalId: collapseExternalIds(cas.externalIdentifiers),
        fromDatasetId: cas.dataset?.id!,
        fromDatasetUri: cas.dataset?.uri!,
        nodeStatus: calcNodeStatus(patientsMapped),
        patients: patientsMapped,
      };
    };

    return createPagedResult(
      pageCases.map((pc) => createCaseMap(pc as dataset.DatasetCase)),
      casesCount,
      limit,
      offset
    );
  }

  private async setStatus(
    user: AuthenticatedUser,
    releaseId: string,
    specimenIds: string[],
    selected: boolean
  ): Promise<any> {
    const { userRole } = await doRoleInReleaseCheck(user, releaseId);

    const { selectedSpecimenIds, datasetUriToIdMap } = await getReleaseInfo(
      this.edgeDbClient,
      releaseId
    );

    // we make a query that returns specimens of only where the input specimen ids belong
    // to the datasets in our release
    const specimensFromValidDatasetsQuery = e.select(
      e.dataset.DatasetSpecimen,
      (s) => ({
        id: true,
        filter: e.op(
          e.op(s.dataset.id, "in", e.set(...datasetUriToIdMap.values())),
          "and",
          e.op(s.id, "in", e.set(...specimenIds.map((a) => e.uuid(a))))
        ),
      })
    );

    const actualSpecimens = await specimensFromValidDatasetsQuery.run(
      this.edgeDbClient
    );

    if (actualSpecimens.length != specimenIds.length)
      throw Error(
        "Mismatch between the specimens that we passed in and those that are allowed specimens in this release"
      );

    if (selected) {
      // add specimens to the selected set
      await e
        .update(e.release.Release, (r) => ({
          filter: e.op(r.id, "=", e.uuid(releaseId)),
          set: {
            selectedSpecimens: { "+=": specimensFromValidDatasetsQuery },
          },
        }))
        .run(this.edgeDbClient);
    } else {
      // remove specimens from the selected set
      await e
        .update(e.release.Release, (r) => ({
          filter: e.op(r.id, "=", e.uuid(releaseId)),
          set: {
            selectedSpecimens: { "-=": specimensFromValidDatasetsQuery },
          },
        }))
        .run(this.edgeDbClient);
    }
  }

  public async setSelected(
    user: AuthenticatedUser,
    releaseId: string,
    specimenIds: string[]
  ): Promise<any | null> {
    return await this.setStatus(user, releaseId, specimenIds, true);
  }

  public async setUnselected(
    user: AuthenticatedUser,
    releaseId: string,
    specimenIds: string[]
  ): Promise<any | null> {
    return await this.setStatus(user, releaseId, specimenIds, false);
  }
}

export const releasesService = new ReleasesService();
