import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { ReleaseDetailType } from "@umccr/elsa-types";
import { AuthenticatedUser } from "../authenticated-user";
import { getReleaseInfo } from "./helpers";
import { ReleaseRoleStrings, UsersService } from "./users-service";
import { releaseGetBoundaryInfo } from "../../../dbschema/queries";
import {
  ReleaseCreateNewError,
  ReleaseViewAccessError,
} from "../exceptions/release-authorisation";

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

  /**
   * This is to check if user has a special create release permission granted by an admin.
   * @param user
   */
  public checkIsAllowedViewReleases(user: AuthenticatedUser): void {
    const isAllow = user.isAllowedViewAllReleases;
    if (!isAllow) {
      throw new ReleaseViewAccessError();
    }
  }

  /**
   * This is to check if user has a special create release permission granted by an admin.
   * @param user
   */
  public checkIsAllowedCreateReleases(user: AuthenticatedUser): void {
    const isAllow = user.isAllowedCreateRelease;
    if (!isAllow) {
      throw new ReleaseCreateNewError();
    }
  }

  /**
   * Return the minimum information we need from the database to establish the
   * base boundary level conditions for proceeding into any release service
   * functionality.
   *
   * That is, this checks that the releaseKey (maybe passed direct from API)
   * is valid, that the given user has a role in the release, and returns some
   * other useful information that may play a part in permissions/boundary
   * checks.
   *
   * @param user the user wanting to perform an operation on a release
   * @param releaseKey the key for the release
   * @protected
   */
  public async getBoundaryInfoWithThrowOnFailure(
    user: AuthenticatedUser,
    releaseKey: string
  ) {
    const boundaryInfo = await releaseGetBoundaryInfo(this.edgeDbClient, {
      userDbId: user.dbId,
      releaseKey: releaseKey,
    });

    const role = boundaryInfo?.role;

    if (!role)
      throw new Error(
        "Unauthenticated attempt to access release, or release does not exist"
      );

    return {
      userRole: role as ReleaseRoleStrings,
      isActivated: !!boundaryInfo.activation,
      isRunningJob: !!boundaryInfo.runningJob,
    };
  }

  /**
   * Get a single release assuming the user definitely has the role
   * passed in and that the release exists (otherwise how could they have a role?).
   * This is the base level fetch that can be used after
   * a previous service call has already established the user's role in
   * this release. This is public because some other services may want to return the
   * current release state from API operations.
   *
   * @param releaseKey
   * @param userRole
   */
  public async getBase(
    releaseKey: string,
    userRole: string
  ): Promise<ReleaseDetailType> {
    const {
      releaseInfo,
      releaseAllDatasetCasesQuery,
      releaseSelectedCasesQuery,
    } = await getReleaseInfo(this.edgeDbClient, releaseKey);

    if (!releaseInfo)
      throw new Error(
        "getBase is meant for use only where the release and user role are already established"
      );

    // the visible cases depend on what roles you have
    const visibleCasesCount =
      userRole === "Administrator"
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
      isAllowedS3Data: releaseInfo.isAllowedS3Data,
      isAllowedGSData: releaseInfo.isAllowedGSData,
      isAllowedR2Data: releaseInfo.isAllowedR2Data,
      // password only gets sent down to the PI
      downloadPassword:
        userRole === "Manager" ? releaseInfo.releasePassword : undefined,
      // data owners can code/edit the release information
      permissionEditSelections: userRole === "Administrator",
      permissionEditApplicationCoded: userRole === "Administrator",
      // data owners cannot however access the raw data (if they want access to their data - they need to go other ways)
      permissionAccessData: userRole !== "Administrator",
    };
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
   * @param releaseKey the release id of the release to alter (must exist)
   * @param field the field name to alter e.g. 'institutes', 'diseases'...
   * @param system the system URI of the entry to add/delete
   * @param code the code value of the entry to add/delete
   * @param removeRatherThanAdd if false then we are asking to add (default), else asking to remove
   * @returns true if the array was actually altered (i.e. the entry was actually removed or added)
   * @private
   */
  protected async alterApplicationCodedArrayEntry(
    userRole: string,
    releaseKey: string,
    field: CodeArrayFields,
    system: string,
    code: string,
    removeRatherThanAdd: boolean = false
  ): Promise<boolean> {
    const { datasetUriToIdMap } = await getReleaseInfo(
      this.edgeDbClient,
      releaseKey
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
          filter: e.op(r.releaseKey, "=", releaseKey),
        }))
        .assert_single()
        .run(tx);

      if (!releaseWithAppCoded)
        throw new Error(
          `Release ${releaseKey} that existed just before this code has now disappeared!`
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
