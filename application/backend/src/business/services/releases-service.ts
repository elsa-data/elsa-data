import { Client } from "edgedb";
import e, { dataset } from "../../../dbschema/edgeql-js";
import {
  ReleaseCaseType,
  ReleaseDetailType,
  ReleaseNodeStatusType,
  ReleasePatientType,
  ReleaseSpecimenType,
  ReleaseSummaryType,
} from "@umccr/elsa-types";
import { AuthenticatedUser } from "../authenticated-user";
import { isSafeInteger } from "lodash";
import { createPagedResult, PagedResult } from "../../api/api-pagination";
import {
  collapseExternalIds,
  doRoleInReleaseCheck,
  getReleaseInfo,
} from "./helpers";
import { inject, injectable, singleton } from "tsyringe";
import { UsersService } from "./users-service";

// an internal string set that tells the service which generic field to alter
// (this allows us to make a mega function that sets all array fields in the same way)
type CodeArrayFields = "diseases" | "countries" | "type";

@injectable()
@singleton()
export class ReleasesService {
  constructor(
    @inject("Database") private edgeDbClient: Client,
    private usersService: UsersService
  ) {}

  public async getAll(
    user: AuthenticatedUser,
    limit: number,
    offset: number
  ): Promise<ReleaseSummaryType[]> {
    const allForUser = await e
      .select(e.release.Release, (r) => ({
        ...e.release.Release["*"],
        runningJob: {
          percentDone: true,
        },
        userRoles: e.select(
          r["<releaseParticipant[is permission::User]"],
          (u) => ({
            id: true,
            filter: e.op(u.id, "=", e.uuid(user.dbId)),
            // "@role": true
          })
        ),
      }))
      .run(this.edgeDbClient);

    return allForUser
      .filter((a) => a.userRoles != null)
      .map((a) => ({
        id: a.id,
        datasetUris: a.datasetUris,
        applicationDacIdentifier:
          a?.applicationDacIdentifier ?? "<unidentified>",
        applicationDacTitle: a?.applicationDacTitle ?? "<untitled>",
        isRunningJobPercentDone: undefined,
      }));
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
  ): Promise<ReleaseDetailType | null> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    return this.getBase(releaseId, userRole);
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
    limit: number,
    offset: number
  ): Promise<PagedResult<ReleaseCaseType> | null> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    const {
      releaseQuery,
      releaseInfoQuery,
      releaseSelectedSpecimensQuery,
      datasetUriToIdMap,
    } = await getReleaseInfo(this.edgeDbClient, releaseId);

    const datasetIdSet =
      datasetUriToIdMap.size > 0
        ? e.set(...datasetUriToIdMap.values())
        : e.cast(e.uuid, e.set());

    const makeFilter = (dsc: any) => {
      return e.op(
        e.op(dsc.dataset.id, "in", datasetIdSet),
        "and",
        e.op(
          e.bool(userRole === "DataOwner"),
          "or",
          e.op(dsc.patients.specimens, "in", releaseSelectedSpecimensQuery)
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
          e.op(p.specimens, "in", releaseSelectedSpecimensQuery)
        ),
        specimens: (s) => ({
          ...e.dataset.DatasetSpecimen["*"],
          isSelected: e.op(s, "in", releaseSelectedSpecimensQuery),
          filter: e.op(
            e.bool(userRole === "DataOwner"),
            "or",
            e.op(s, "in", releaseSelectedSpecimensQuery)
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
        nodeStatus: ((spec as any).isSelected
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
      pageCases.map((pc) =>
        createCaseMap(pc as unknown as dataset.DatasetCase)
      ),
      casesCount,
      limit
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
  ): Promise<ReleaseDetailType> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    const didMutate = await this.alterApplicationCodedArrayEntry(
      userRole,
      releaseId,
      "diseases",
      system,
      code,
      false
    );

    return await this.getBase(releaseId, userRole);
  }

  public async removeDiseaseFromApplicationCoded(
    user: AuthenticatedUser,
    releaseId: string,
    system: string,
    code: string
  ): Promise<ReleaseDetailType> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    const didMutate = await this.alterApplicationCodedArrayEntry(
      userRole,
      releaseId,
      "diseases",
      system,
      code,
      true
    );

    return await this.getBase(releaseId, userRole);
  }

  public async addCountryToApplicationCoded(
    user: AuthenticatedUser,
    releaseId: string,
    system: string,
    code: string
  ): Promise<ReleaseDetailType> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    const didMutate = await this.alterApplicationCodedArrayEntry(
      userRole,
      releaseId,
      "countries",
      system,
      code,
      false
    );

    return await this.getBase(releaseId, userRole);
  }

  public async removeCountryFromApplicationCoded(
    user: AuthenticatedUser,
    releaseId: string,
    system: string,
    code: string
  ): Promise<ReleaseDetailType> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    const didMutate = await this.alterApplicationCodedArrayEntry(
      userRole,
      releaseId,
      "countries",
      system,
      code,
      true
    );

    return await this.getBase(releaseId, userRole);
  }

  public async setTypeOfApplicationCoded(
    user: AuthenticatedUser,
    releaseId: string,
    type: "HMB" | "DS" | "CC" | "GRU" | "POA"
  ): Promise<ReleaseDetailType> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    await this.edgeDbClient.transaction(async (tx) => {
      // get the current coded application
      const releaseWithAppCoded = await e
        .select(e.release.Release, (r) => ({
          applicationCoded: {
            id: true,
            studyType: true,
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

      await e
        .update(e.release.ApplicationCoded, (ac) => ({
          filter: e.op(
            ac.id,
            "=",
            e.uuid(releaseWithAppCoded.applicationCoded.id)
          ),
          set: {
            studyType: type,
          },
        }))
        .run(tx);
    });

    return await this.getBase(releaseId, userRole);
  }

  /**
   * Get a single release assuming the user definitely has the role
   * passed in and that the release exists (otherwise how could they have a role?).
   * This is the base level fetch that can be used after
   * a previous service call has already established the user's role in
   * this release. This is public because some other services may want to return the
   * current release state from API operations.
   *
   * @param releaseId
   * @param userRole
   */
  public async getBase(
    releaseId: string,
    userRole: string
  ): Promise<ReleaseDetailType> {
    const thisRelease = await e
      .select(e.release.Release, (r) => ({
        ...e.release.Release["*"],
        applicationCoded: {
          ...e.release.ApplicationCoded["*"],
        },
        runningJob: {
          ...e.job.Job["*"],
        },
        filter: e.op(r.id, "=", e.uuid(releaseId)),
      }))
      .assert_single()
      .run(this.edgeDbClient);

    if (!thisRelease)
      throw new Error(
        "getPreAuthorised is meant for use only where the release and user role are already established"
      );

    const hasRunningJob =
      thisRelease.runningJob && thisRelease.runningJob.length === 1;

    if (thisRelease.runningJob && thisRelease.runningJob.length > 1)
      throw new Error(
        "There should only be one running job (if any job is running)"
      );

    return {
      id: thisRelease.id,
      datasetUris: thisRelease.datasetUris,
      applicationDacDetails: thisRelease.applicationDacDetails!,
      applicationDacIdentifier: thisRelease.applicationDacIdentifier!,
      applicationDacTitle: thisRelease.applicationDacTitle!,
      applicationCoded: {
        type: thisRelease.applicationCoded.studyType,
        diseases: thisRelease.applicationCoded.diseasesOfStudy,
        countriesInvolved: thisRelease.applicationCoded.countriesInvolved,
      },
      runningJob: hasRunningJob
        ? {
            percentDone: thisRelease.runningJob[0].percentDone,
            messages: thisRelease.runningJob[0].messages,
            requestedCancellation:
              thisRelease.runningJob[0].requestedCancellation,
          }
        : undefined,
      // data owners can code/edit the release information
      permissionEditApplicationCoded: userRole === "DataOwner",
      permissionEditSelections: userRole === "DataOwner",
      // data owners cannot however access the raw data (if they want access to their data - they need to go other ways)
      permissionAccessData: userRole !== "DataOwner",
    };
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
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    const { datasetUriToIdMap } = await getReleaseInfo(
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
   * @param userRole the role the user has in this release (must be something!)
   * @param releaseId the release id of the release to alter (must exist)
   * @param field the field name to alter e.g. 'institutes', 'diseases'...
   * @param system the system URI of the entry to add/delete
   * @param code the code value of the entry to add/delete
   * @param removeRatherThanAdd if false then we are asking to add (default), else asking to remove
   * @returns true if the array was actually altered (i.e. the entry was actually removed or added)
   * @private
   */
  private async alterApplicationCodedArrayEntry(
    userRole: string,
    releaseId: string,
    field: CodeArrayFields,
    system: string,
    code: string,
    removeRatherThanAdd: boolean = false
  ): Promise<boolean> {
    const { datasetUriToIdMap } = await getReleaseInfo(
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
