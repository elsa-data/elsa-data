import * as edgedb from "edgedb";
import e, { dataset, release } from "../../../dbschema/edgeql-js";
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
import {
  collapseExternalIds,
  doRoleInReleaseCheck,
  getReleaseInfo,
} from "./releases-helper";
import { NamedTupleType } from "edgedb/dist/reflection";
import { makeSingleCodeArray } from "../../test-data/insert-test-data-helpers";
import ApplicationCoded = release.ApplicationCoded;

// an internal string set that tells the service which generic field to alter
// (this allows us to make a mega function that sets all array fields in the same way)
type CodeArrayFields = "diseases" | "countries" | "institutes";

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

  public async addDiseaseToApplicationCoded(
    user: AuthenticatedUser,
    releaseId: string,
    system: string,
    code: string
  ): Promise<boolean | null> {
    return await this.alterApplicationCodedArrayEntry(
      user,
      releaseId,
      "diseases",
      system,
      code,
      false
    );
  }

  public async removeDiseaseFromApplicationCoded(
    user: AuthenticatedUser,
    releaseId: string,
    system: string,
    code: string
  ): Promise<boolean | null> {
    return await this.alterApplicationCodedArrayEntry(
      user,
      releaseId,
      "diseases",
      system,
      code,
      true
    );
  }

  public async addCountryToApplicationCoded(
    user: AuthenticatedUser,
    releaseId: string,
    system: string,
    code: string
  ): Promise<boolean | null> {
    return await this.alterApplicationCodedArrayEntry(
      user,
      releaseId,
      "countries",
      system,
      code,
      false
    );
  }

  public async removeCountryFromApplicationCoded(
    user: AuthenticatedUser,
    releaseId: string,
    system: string,
    code: string
  ): Promise<boolean | null> {
    return await this.alterApplicationCodedArrayEntry(
      user,
      releaseId,
      "countries",
      system,
      code,
      true
    );
  }

  /**
   * A mega function that handles altering the sharing status of a node in our 'release'.
   *
   * @param user the user attempting the changes
   * @param releaseId the release id of the release to alter
   * @param specimenIds
   * @param selected the status to set i.e. selected = true means shared, selected = false means not shared
   * @private
   */
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
    // we need to do this to prevent our list of valid shared specimens from being
    // infected with edgedb nodes from different datasets

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

  /**
   * A mega function that can be used to add or delete coded values from any application
   * coded field that is a coded array. So this means things like list of diseases, countries,
   * institutes etc. The basic pattern of code is the same for all of them - hence us
   * merging into one big function. Unfortunately this leads to some pretty messy/duplicated code - as
   * I can't make EdgeDb libraries re-use code where I'd like (which is possibly more about me than
   * edgedb)
   *
   * @param user the user attempting the changes
   * @param releaseId the release id of the release to alter
   * @param field the field name to alter e.g. 'institutes', 'diseases'...
   * @param system the system URI of the entry to add/delete
   * @param code the code value of the entry to add/delete
   * @param removeRatherThanAdd if false then we are asking to add (default), else asking to remove
   * @returns true if the array was actually altered (i.e. the entry was actually removed or added)
   * @private
   */
  private async alterApplicationCodedArrayEntry(
    user: AuthenticatedUser,
    releaseId: string,
    field: CodeArrayFields,
    system: string,
    code: string,
    removeRatherThanAdd: boolean = false
  ): Promise<boolean> {
    const { userRole } = await doRoleInReleaseCheck(user, releaseId);

    const { selectedSpecimenIds, datasetUriToIdMap } = await getReleaseInfo(
      this.edgeDbClient,
      releaseId
    );

    // we need to get/set the Coded Application all within a transaction context
    await this.edgeDbClient.transaction(async (tx) => {
      // get the current coded application
      const releaseWithAppCoded = await e
        .select(e.release.Release, (r) => ({
          applicationCoded: {
            id: true,
            studyType: true,
            institutesInvolved: true,
            countriesInvolved: true,
            diseasesOfStudy: true,
          },
          filter: e.op(r.id, "=", e.uuid(releaseId)),
        }))
        .assert_single()
        .run(tx);

      if (!releaseWithAppCoded)
        throw new Error(
          `Release ${releaseId} that existed just before this code has now disappeared!`
        );

      let newArray: { system: string; code: string }[];

      if (field === "diseases")
        newArray = releaseWithAppCoded.applicationCoded.diseasesOfStudy;
      else if (field === "institutes")
        newArray = releaseWithAppCoded.applicationCoded.institutesInvolved;
      else if (field === "countries")
        newArray = releaseWithAppCoded.applicationCoded.countriesInvolved;
      else
        throw new Error(
          `Field instruction of ${field} was not a known field for array alteration`
        );

      const commonFilter = (ac: any) => {
        return e.op(
          ac.id,
          "=",
          e.uuid(releaseWithAppCoded.applicationCoded.id)
        );
      };

      if (removeRatherThanAdd) {
        const oldLength = newArray.length;

        // we want to remove any entries with the same system/code from our array
        // (there should only be 0 or 1 - but this safely removes *all* if the insertion was broken somehow)
        newArray = newArray.filter(
          (tup) => tup.system !== system || tup.code !== code
        );

        // nothing to mutate - return false
        if (newArray.length == oldLength) return false;

        if (field === "diseases")
          await e
            .update(e.release.ApplicationCoded, (ac) => ({
              filter: commonFilter(ac),
              set: {
                diseasesOfStudy: newArray,
              },
            }))
            .run(tx);
        else if (field === "institutes")
          await e
            .update(e.release.ApplicationCoded, (ac) => ({
              filter: commonFilter(ac),
              set: {
                institutesInvolved: newArray,
              },
            }))
            .run(tx);
        else if (field === "countries")
          await e
            .update(e.release.ApplicationCoded, (ac) => ({
              filter: commonFilter(ac),
              set: {
                countriesInvolved: newArray,
              },
            }))
            .run(tx);
        else
          throw new Error(
            `Field instruction of ${field} was not handled in the remove operation`
          );
      } else {
        // only do an insert if the entry is not already present
        // i.e. set like semantics - but with an ordered array
        // TODO: could we be ok with an actual e.set() (we wouldn't want the UI to jump around due to ordering changes)
        if (
          // if the entry already exists - we can return - nothing to do
          newArray.findIndex(
            (tup) => tup.system === system && tup.code === code
          ) > -1
        )
          return false;

        const commonAddition = e.array([
          e.tuple({ system: system, code: code }),
        ]);

        if (field === "diseases")
          await e
            .update(e.release.ApplicationCoded, (ac) => ({
              filter: commonFilter(ac),
              set: {
                diseasesOfStudy: e.op(ac.diseasesOfStudy, "++", commonAddition),
              },
            }))
            .run(tx);
        else if (field === "institutes")
          await e
            .update(e.release.ApplicationCoded, (ac) => ({
              filter: commonFilter(ac),
              set: {
                institutesInvolved: e.op(
                  ac.institutesInvolved,
                  "++",
                  commonAddition
                ),
              },
            }))
            .run(tx);
        else if (field === "countries")
          await e
            .update(e.release.ApplicationCoded, (ac) => ({
              filter: commonFilter(ac),
              set: {
                countriesInvolved: e.op(
                  ac.countriesInvolved,
                  "++",
                  commonAddition
                ),
              },
            }))
            .run(tx);
        else
          throw new Error(
            `Field instruction of ${field} was not handled in the add operation`
          );
      }
    });

    return true;
  }
}

export const releasesService = new ReleasesService();
