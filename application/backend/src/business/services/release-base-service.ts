import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import {
  DataSharingAwsAccessPointType,
  ReleaseDetailType,
  ReleaseParticipantRoleType,
} from "@umccr/elsa-types";
import { AuthenticatedUser } from "../authenticated-user";
import { getReleaseInfo } from "./helpers";
import { UserService } from "./user-service";
import { releaseGetBoundaryInfo } from "../../../dbschema/queries";
import {
  ReleaseCreateError,
  ReleaseViewError,
} from "../exceptions/release-authorisation";
import { ElsaSettings } from "../../config/elsa-settings";
import { AuditEventService } from "./audit-event-service";
import { AuditEventTimedService } from "./audit-event-timed-service";
import {
  SharerAwsAccessPointType,
  SharerHtsgetType,
} from "../../config/config-schema-sharer";
import { release } from "../../../dbschema/interfaces";
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStacksCommandOutput,
} from "@aws-sdk/client-cloudformation";
import { ReleaseSelectionPermissionError } from "../exceptions/release-selection";
import { ReleaseNoEditingWhilstActivatedError } from "../exceptions/release-activation";

export type UserRoleInRelease = ReleaseParticipantRoleType & "AdminView";

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
  private readonly VIEW_AUDIT_EVENT_TIME: Duration = { minutes: 30 };

  protected constructor(
    protected readonly settings: ElsaSettings,
    protected readonly edgeDbClient: edgedb.Client,
    protected readonly features: ReadonlySet<string>,
    protected readonly userService: UserService,
    protected readonly auditEventService: AuditEventService,
    protected readonly auditEventTimedService: AuditEventTimedService,
    private readonly cfnClient: CloudFormationClient
  ) {}

  /**
   * Some user role are allowed to change other users role for its release participants.
   * Eventually this must be guarded so that they can't change/make permission to a higher hierarchy.
   * This function will spit out the available options that this user could assigned/alter to other participant.
   * e.g. A manager cannot a member to an administrator (as it is higher than its own role)
   *
   * @param currentUserRole The authenticated user role
   * @returns The options where this user could alter
   */
  protected getParticipantRoleOption(
    currentUserRole: ReleaseParticipantRoleType | string
  ): ReleaseParticipantRoleType[] | null {
    switch (currentUserRole) {
      case "Administrator": {
        return ["Administrator", "Manager", "Member"];
      }

      case "Manager": {
        return ["Manager", "Member"];
      }

      case "Member": {
        // A member should not have the options to alter anything
        return null;
      }

      default:
        return null;
    }
  }

  public async createReleaseViewAuditEvent(
    user: AuthenticatedUser,
    releaseKey: string
  ): Promise<void> {
    await this.auditEventTimedService.createTimedAuditEvent(
      `${releaseKey}${user.subjectId}`,
      this.VIEW_AUDIT_EVENT_TIME,
      async (start) => {
        return await this.auditEventService.insertViewedReleaseAuditEvent(
          user,
          releaseKey,
          this.VIEW_AUDIT_EVENT_TIME,
          start,
          this.edgeDbClient
        );
      }
    );
  }

  /**
   * This is to check if user has a special create release permission granted by an admin.
   * @param user
   */
  public checkIsAllowedViewReleases(user: AuthenticatedUser): void {
    const isAllow = user.isAllowedOverallAdministratorView;
    if (!isAllow) {
      throw new ReleaseViewError();
    }
  }

  /**
   * This is to check if user has a special create release permission granted by an admin.
   * @param user
   */
  public checkIsAllowedCreateReleases(user: AuthenticatedUser): void {
    const isAllow = user.isAllowedCreateRelease;
    if (!isAllow) {
      throw new ReleaseCreateError();
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

    const roleInDb = boundaryInfo?.role as
      | ReleaseParticipantRoleType
      | null
      | undefined;

    if (!boundaryInfo) throw new ReleaseViewError(releaseKey);

    // If boundaryInfo exist but userRole is empty, then it must be an AdminView
    const role = roleInDb ? roleInDb : "AdminView";

    return {
      userRole: role as UserRoleInRelease,
      isActivated: !!boundaryInfo.activation,
      isRunningJob: !!boundaryInfo.runningJob,
    };
  }

  /**
   * Get the config for a feature. Currently, this can just get config for htsget.
   * It might be good to have this for other features that require config properties to
   * be set.
   *
   * @param property
   */
  public configForFeature(property: "isAllowedHtsget"): URL | undefined {
    const h = this.settings.sharers.filter(
      (s) => s.type === "htsget"
    ) as SharerHtsgetType[];

    if (h.length === 1) return new URL(h[0].url);
    return undefined;
  }

  /**
   * Get the config for the AWS access point feature or undefined if this
   * sharer is not in the config.
   */
  public configForAwsAccessPointFeature():
    | SharerAwsAccessPointType
    | undefined {
    const h = this.settings.sharers.filter(
      (s) => s.type === "aws-access-point"
    ) as SharerAwsAccessPointType[];

    if (h.length === 1) return h[0];

    return undefined;
  }

  /**
   * Where the AWS access point feature is enabled we check to see what the
   * current access point status is.
   *
   * @param config
   * @param releaseKey
   * @param awsAccessPointName
   *
   * NOTE we only call this method when we are
   * sure that the access point mechanism is configured - else it would just be a
   * wasted unnecessary call to CloudFormation
   */
  public async getAwsAccessPointDetail(
    config: SharerAwsAccessPointType,
    releaseKey: string,
    awsAccessPointName?: string
  ): Promise<DataSharingAwsAccessPointType | undefined> {
    // NOTE we need to calculate the installation status *independent* of the config lookups
    //      - because we need the ability to "uninstall" an access point stack after the config
    //        changes (i.e. if I remove the config for a "Nextflow VPC" - I still need the ability
    //        to remove previously installed access points that used that config)
    let isAwsAccessPointInstalled = false;
    let isAwsAccessPointArn: string | undefined = undefined;

    try {
      // TODO FIX - first need to refactor the release base into a mixin - so do in another PR
      //            we have a circular dependency otherwise
      const releaseStackName = `elsa-data-release-${releaseKey}`;
      const releaseStackResult = await this.cfnClient.send(
        new DescribeStacksCommand({
          StackName: releaseStackName,
        })
      );
      if (
        releaseStackResult &&
        releaseStackResult.Stacks &&
        releaseStackResult.Stacks.length == 1
      ) {
        isAwsAccessPointInstalled = true;
        isAwsAccessPointArn = releaseStackResult.Stacks[0].StackId;
      }
    } catch (e) {
      // TODO tighten the error code here so we don't gobble up other "unexpected" errors
      // describing a stack that is not present throws an exception so we take that to mean it is
      // not present
    }

    const firstNameMatch = Object.entries(config.allowedVpcs).find(
      (n) => n[0] === awsAccessPointName
    );

    if (firstNameMatch) {
      return {
        name: firstNameMatch[0],
        accountId: firstNameMatch[1].accountId,
        vpcId: firstNameMatch[1].vpcId,
        installed: isAwsAccessPointInstalled,
        installedStackArn: isAwsAccessPointArn,
      };
    } else {
      return {
        name: "",
        accountId: "",
        vpcId: "",
        installed: isAwsAccessPointInstalled,
        installedStackArn: isAwsAccessPointArn,
      };
    }
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
    userRole: UserRoleInRelease
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

    if (releaseInfo.runningJob && releaseInfo.runningJob.length > 1)
      throw new Error(
        "There should only be one running job (if any job is running)"
      );

    // only the admins know about long-running jobs
    const hasRunningJob =
      userRole === "Administrator"
        ? releaseInfo.runningJob && releaseInfo.runningJob.length === 1
        : false;

    const isAllowedAwsAccessPointConfig = this.configForAwsAccessPointFeature();

    const dataSharingAwsAccessPoint = isAllowedAwsAccessPointConfig
      ? await this.getAwsAccessPointDetail(
          isAllowedAwsAccessPointConfig,
          releaseKey,
          releaseInfo.dataSharingConfiguration.awsAccessPointName
        )
      : undefined;

    return {
      id: releaseInfo.id,
      roleInRelease: userRole,
      lastUpdatedDateTime: releaseInfo.lastUpdated,
      lastUpdatedUserSubjectId: releaseInfo.lastUpdatedSubjectId,
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

      // A list of roles allowed to edit other user's role depending on this auth user
      // e.g. A manager cannot edit Administrator role.
      rolesAllowedToAlterParticipant: this.getParticipantRoleOption(userRole),

      // administrators can code/edit the release information
      permissionViewSelections:
        userRole === "Administrator" || userRole === "AdminView",
      permissionEditSelections: userRole === "Administrator",
      permissionEditApplicationCoded: userRole === "Administrator",
      // Only 'Manager' and 'Member' can access data
      permissionAccessData: userRole === "Manager" || userRole === "Member",

      // data sharing objects
      dataSharingObjectSigning: releaseInfo.dataSharingConfiguration
        .objectSigningEnabled
        ? {
            expiryHours:
              releaseInfo.dataSharingConfiguration.objectSigningExpiryHours,
          }
        : undefined,
      dataSharingCopyOut: releaseInfo.dataSharingConfiguration.copyOutEnabled
        ? {
            destinationLocation:
              releaseInfo.dataSharingConfiguration.copyOutDestinationLocation,
          }
        : undefined,
      dataSharingHtsgetRestrictions:
        releaseInfo.dataSharingConfiguration.htsgetRestrictions,
      dataSharingHtsget: releaseInfo.dataSharingConfiguration.htsgetEnabled
        ? {
            url: this.configForFeature("isAllowedHtsget")?.toString()!,
          }
        : undefined,
      dataSharingAwsAccessPoint: releaseInfo.dataSharingConfiguration
        .awsAccessPointEnabled
        ? dataSharingAwsAccessPoint
        : undefined,
      dataSharingGcpStorageIam: releaseInfo.dataSharingConfiguration
        .gcpStorageIamEnabled
        ? {
            users: releaseInfo.dataSharingConfiguration.gcpStorageIamUsers,
          }
        : undefined,
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
   * @param user the user performing the change
   * @param releaseKey the release id of the release to alter (must exist)
   * @param field the field name to alter e.g. 'institutes', 'diseases'...
   * @param system the system URI of the entry to add/delete
   * @param code the code value of the entry to add/delete
   * @param removeRatherThanAdd if false then we are asking to add (default), else asking to remove
   * @returns The new ReleaseDetailType after the alteration
   * @private
   */
  protected async alterApplicationCodedArrayEntry(
    user: AuthenticatedUser,
    releaseKey: string,
    field: CodeArrayFields,
    system: string,
    code: string,
    removeRatherThanAdd: boolean = false
  ): Promise<ReleaseDetailType> {
    const { userRole, isActivated } =
      await this.getBoundaryInfoWithThrowOnFailure(user, releaseKey);

    const isRemoveOrAddText = removeRatherThanAdd ? `removing` : `adding`;
    const actionDescription = `${isRemoveOrAddText} the application coded array (if audit details is false means nothing has changed)`;

    const { datasetUriToIdMap } = await getReleaseInfo(
      this.edgeDbClient,
      releaseKey
    );

    // we need to get/set the Coded Application all within a transaction context
    return await this.auditEventService.transactionalUpdateInReleaseAuditPattern(
      user,
      releaseKey,
      actionDescription,
      async () => {
        if (userRole != "Administrator")
          throw new ReleaseSelectionPermissionError(releaseKey);

        if (isActivated)
          throw new ReleaseNoEditingWhilstActivatedError(releaseKey);
      },
      async (tx, a) => {
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
                  diseasesOfStudy: e.op(
                    ac.diseasesOfStudy,
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
        return { field, system, code };
      },
      async () => await this.getBase(releaseKey, userRole)
    );
  }
}
