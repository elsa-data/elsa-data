import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { ReleaseDetailType } from "@umccr/elsa-types";
import { AuthenticatedUser } from "../authenticated-user";
import { doRoleInReleaseCheck, getReleaseInfo } from "./helpers";
import { UsersService } from "./users-service";
import { touchRelease } from "../db/release-queries";

// an internal string set that tells the service which generic field to alter
// (this allows us to make a mega function that sets all array fields in the same way)
type CodeArrayFields = "diseases" | "countries" | "type";

/**
 * The base level functionality for releases.
 *
 * Given releases are the major feature of Elsa - there is an enormous amount
 * of functionality that would fit into a ReleaseService. So we have moved some
 * common functionality here and have multiple services.
 */
export abstract class ReleaseBaseService {
  protected constructor(
    protected readonly edgeDbClient: edgedb.Client,
    protected readonly usersService: UsersService
  ) {}

  /* TODO move helpers.ts getReleaseInfo to here
      protected baseQueriesForReleases(userId: string) {
    const releasesForUserQuery = e.select(e.release.Release, (r) => ({
      ...e.release.Release["*"],
      runningJob: {
        percentDone: true,
      },
      // the master computation of whether we are currently enabled for access
      accessEnabled: e.op(
          e.op(e.datetime_current(), ">=", r.releaseStarted),
          "and",
          e.op(e.datetime_current(), "<=", r.releaseEnded)
      ),
      userRoles: e.select(
        r["<releaseParticipant[is permission::User]"],
        (u) => ({
          id: true,
          filter: e.op(u.id, "=", e.uuid(userId)),
          // "@role": true
        })
      ),
    }));

    return {
      releasesForUserQuery
    }
  }

  protected baseQueriesForSingleRelease(releaseId: string) {
    const releaseQuery = e
      .select(e.release.Release, (r) => ({
        filter: e.op(r.id, "=", e.uuid(releaseId)),
      }))
      .assert_single();

    // the set of selected specimens from the release
    const releaseSelectedSpecimensQuery = e.select(
      releaseQuery.selectedSpecimens
    );

    const releaseInfoQuery = e.select(releaseQuery, (r) => ({
      ...e.release.Release["*"],
      applicationCoded: {
        ...e.release.ApplicationCoded["*"],
      },
      runningJob: {
        ...e.job.Job["*"],
      },
      // the master computation of whether we are currently enabled for access
      accessEnabled: e.op(
        e.op(e.datetime_current(), ">=", r.releaseStarted),
        "and",
        e.op(e.datetime_current(), "<=", r.releaseEnded)
      ),
      // the manual exclusions are nodes that we have explicitly said that they and their children should never be shared
      //manualExclusions: true,
      // we are loosely linked (by uri) to datasets which this release draws data from
      // TODO: revisit the loose linking
      datasetIds: e.select(e.dataset.Dataset, (ds) => ({
        id: true,
        uri: true,
        filter: e.op(ds.uri, "in", e.array_unpack(r.datasetUris)),
      })),
    }));

    return {
      releaseQuery,
      releaseSelectedSpecimensQuery,
      releaseInfoQuery,
    };
  } */

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
    const {
      releaseInfo,
      releaseAllDatasetCasesQuery,
      releaseSelectedCasesQuery,
    } = await getReleaseInfo(this.edgeDbClient, releaseId);

    if (!releaseInfo)
      throw new Error(
        "getBase is meant for use only where the release and user role are already established"
      );

    // the visible cases depend on what roles you have
    const visibleCasesCount =
      userRole === "DataOwner"
        ? await e.count(releaseAllDatasetCasesQuery).run(this.edgeDbClient)
        : await e.count(releaseSelectedCasesQuery).run(this.edgeDbClient);

    const hasRunningJob =
      releaseInfo.runningJob && releaseInfo.runningJob.length === 1;

    if (releaseInfo.runningJob && releaseInfo.runningJob.length > 1)
      throw new Error(
        "There should only be one running job (if any job is running)"
      );

    return {
      id: releaseInfo.id,
      datasetUris: releaseInfo.datasetUris,
      applicationDacDetails: releaseInfo.applicationDacDetails!,
      applicationDacIdentifier: releaseInfo.applicationDacIdentifier.value,
      applicationDacTitle: releaseInfo.applicationDacTitle!,
      applicationCoded: {
        type: releaseInfo.applicationCoded.studyType,
        diseases: releaseInfo.applicationCoded.diseasesOfStudy,
        countriesInvolved: releaseInfo.applicationCoded.countriesInvolved,
        beaconQuery: releaseInfo.applicationCoded.beaconQuery,
      },
      runningJob: hasRunningJob
        ? {
            percentDone: releaseInfo.runningJob[0].percentDone,
            messages: releaseInfo.runningJob[0].messages,
            requestedCancellation:
              releaseInfo.runningJob[0].requestedCancellation,
          }
        : undefined,
      visibleCasesCount: visibleCasesCount,
      activation:
        releaseInfo.activation != null
          ? {
              activatedByDisplayName:
                releaseInfo.activation.activatedByDisplayName,
            }
          : undefined,
      isAllowedReadData: releaseInfo.isAllowedReadData,
      isAllowedVariantData: releaseInfo.isAllowedVariantData,
      isAllowedPhenotypeData: releaseInfo.isAllowedPhenotypeData,
      // password only gets sent down to the PI
      downloadPassword:
        userRole === "PI" ? releaseInfo.releasePassword : undefined,
      // data owners can code/edit the release information
      permissionEditSelections: userRole === "DataOwner",
      permissionEditApplicationCoded: userRole === "DataOwner",
      // data owners cannot however access the raw data (if they want access to their data - they need to go other ways)
      permissionAccessData: userRole !== "DataOwner",
    };
  }

  /**
   * A mega function that handles altering the sharing status of a dataset node associated with our 'release'.
   *
   * @param user the user attempting the changes
   * @param releaseId the release id of the release to alter
   * @param specimenIds the edgedb ids of specimens from datasets of our release, or an empty list if the status should be applied to all specimens in the release
   * @param statusToSet the status to set i.e. selected = true means shared, selected = false means not shared
   *
   * TODO: make this work with any node - not just specimen nodes (i.e. setStatus of patient)
   *
   * This function is responsible for ensuring the passed in identifiers are valid - so it makes sure
   * that all specimen ids are from datasets that are in this release.
   */
  protected async setSelectedStatus(
    user: AuthenticatedUser,
    statusToSet: boolean,
    releaseId: string,
    specimenIds: string[] = []
  ): Promise<ReleaseDetailType> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    // note this db set we get is likely to be small (bounded by the number of datasets in a release)
    // so we can get away with some use of a edgedb literal 'X in { "A", "B", "C" }'
    // (which we wouldn't get away with if say there were 1 million datasets!)
    const { releaseAllDatasetIdDbSet } = await getReleaseInfo(
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
          e.op(s.dataset.id, "in", releaseAllDatasetIdDbSet),
          "and",
          specimenIds.length === 0
            ? e.bool(true)
            : e.op(s.id, "in", e.set(...specimenIds.map((a) => e.uuid(a))))
        ),
      })
    );

    const actualSpecimens = await specimensFromValidDatasetsQuery.run(
      this.edgeDbClient
    );

    if (specimenIds.length > 0 && actualSpecimens.length != specimenIds.length)
      throw Error(
        "Mismatch between the specimens that we passed in and those that are allowed specimens in this release"
      );

    if (statusToSet) {
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

    await touchRelease.run(this.edgeDbClient, { releaseId });

    return await this.getBase(releaseId, userRole);
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
  protected async alterApplicationCodedArrayEntry(
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
