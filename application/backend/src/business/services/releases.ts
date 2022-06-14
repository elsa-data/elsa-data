import * as edgedb from "edgedb";
import e, { dataset } from "../../../dbschema/edgeql-js";
import {
  DatasetDeepType,
  ReleaseCaseType,
  ReleaseDatasetType,
  ReleaseNodeStatusType,
  ReleasePatientType,
  ReleaseSpecimenType,
} from "@umccr/elsa-types";
import { AuthUser } from "../../auth/auth-user";
import { usersService } from "./users";
import { AuthenticatedUser } from "../authenticated-user";

class ReleasesService {
  private edgeDbClient = edgedb.createClient();

  public async getAll(user: AuthUser, limit: number, offset: number) {
    return {};
  }

  public async get(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<DatasetDeepType | null> {
    const userRole = await usersService.roleInRelease(user, releaseId);

    if (userRole != "PI")
      throw new Error("Unauthenticated attempt to access release");

    return null;
  }

  /**
   * Get all the cases for a release including checkbox status down to specimen level.
   *
   * @param user
   * @param releaseId
   * @param limit
   * @param offset
   */
  public async getCases(
    user: AuthenticatedUser,
    releaseId: string,
    limit: number,
    offset: number
  ): Promise<ReleaseDatasetType | null> {
    // first check out access rights to the release
    const userRole = await usersService.roleInRelease(user, releaseId);

    if (userRole != "PI")
      throw new Error("Unauthenticated attempt to access release");

    // the list of selected specimens will be merged into the hierarchy data
    const releaseInfo = await e
      .select(e.release.Release, (r) => ({
        selectedSpecimens: true,
        datasetIds: e.select(e.dataset.Dataset, (ds) => ({
          id: true,
          uri: true,
          filter: e.op(ds.uri, "in", e.array_unpack(r.datasetUris)),
        })),
        filter: e.op(r.id, "=", e.uuid(releaseId)),
      }))
      .assert_single()
      .run(this.edgeDbClient);

    if (!releaseInfo) return null;

    const releaseSelectedSpecimens: Set<string> = new Set<string>(
      releaseInfo.selectedSpecimens.map((ss) => ss.id)
    );

    // const datasetMap = releaseInfo.datasetIds.((d) => {
    //     d.
    // })

    console.log(releaseSelectedSpecimens);

    const caseSearch = e.select(e.dataset.DatasetCase, (dsc) => ({
      ...e.dataset.DatasetCase["*"],
      externalIdentifiers: true,
      patients: {
        id: true,
        externalIdentifiers: true,
        specimens: {
          id: true,
          externalIdentifiers: true,
        },
      },
      filter: e.op(dsc.dataset.id, "in", e.uuid(releaseInfo.datasetIds[0].id)),
      limit: e.int32(limit),
      offset: e.int32(offset),
    }));

    const pageCases = await caseSearch.run(this.edgeDbClient);

    // we need to construct the result hierarchies, including computing the checkbox at intermediate nodes

    if (!pageCases) return null;

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

    const createSpecimenMap = (
      spec: dataset.DatasetSpecimen
    ): ReleaseSpecimenType => {
      return {
        id: spec.id,
        nodeStatus: (releaseSelectedSpecimens.has(spec.id)
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
        nodeStatus: calcNodeStatus(patientsMapped),
        patients: patientsMapped,
      };
    };

    const casesMapped = pageCases.map((pc) =>
      createCaseMap(pc as dataset.DatasetCase)
    );

    return {
      id: "asad",
      nodeStatus: calcNodeStatus(casesMapped),
      cases: casesMapped,
    };
  }
}

export const releasesService = new ReleasesService();
