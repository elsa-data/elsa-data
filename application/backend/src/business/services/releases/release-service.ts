import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import e from "../../../../dbschema/edgeql-js";
import {
  ReleaseDetailType,
  ReleaseManualType,
  ReleaseSummaryType,
} from "@umccr/elsa-types";
import { AuthenticatedUser } from "../../authenticated-user";
import { PagedResult } from "../../../api/helpers/pagination-helpers";
import { getReleaseInfo } from "../helpers";
import { inject, injectable } from "tsyringe";
import { UserService } from "../user-service";
import { ReleaseBaseService, UserRoleInRelease } from "./release-base-service";
import { getNextReleaseKey } from "../../db/release-queries";
import { ReleaseNoEditingWhilstActivatedError } from "../../exceptions/release-activation";
import { ReleaseDisappearedError } from "../../exceptions/release-disappear";
import { ElsaSettings } from "../../../config/elsa-settings";
import { format } from "date-fns";
import {
  applyHtsgetRestriction,
  releaseGetAllByUser,
  releaseGetCounterNext,
  removeHtsgetRestriction,
} from "../../../../dbschema/queries";
import { auditReleaseUpdateStart, auditSuccess } from "../../../audit-helpers";
import { AuditEventService } from "../audit-event-service";
import { Logger } from "pino";
import { jobAsBadgeLabel } from "../jobs/job-helpers";
import {
  checkValidApplicationUser,
  insertPotentialOrReal,
  splitUserEmails,
} from "../_dac-user-helper";
import { AuditEventTimedService } from "../audit-event-timed-service";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { ReleaseSelectionPermissionError } from "../../exceptions/release-selection";
import {
  ReleaseCreateError,
  ReleaseViewError,
} from "../../exceptions/release-authorisation";
import { UserData } from "../../data/user-data";
import { generateZipPassword } from "../../../helpers/passwords";

@injectable()
export class ReleaseService extends ReleaseBaseService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    @inject("Settings") settings: ElsaSettings,
    @inject("Features") features: ReadonlySet<string>,
    @inject("Logger") private readonly logger: Logger,
    @inject(AuditEventService)
    auditEventService: AuditEventService,
    @inject("ReleaseAuditTimedService")
    auditEventTimedService: AuditEventTimedService,
    @inject(UserService) userService: UserService,
    @inject(UserData) private readonly userData: UserData,
    @inject("CloudFormationClient") cfnClient: CloudFormationClient
  ) {
    super(
      settings,
      edgeDbClient,
      features,
      userService,
      auditEventService,
      auditEventTimedService,
      cfnClient
    );
  }

  /**
   * Return summary information about all the releases that are of interest to the user.
   * For the moment, "interest" is defined as being a participant in the release with
   * any role.
   *
   * @param user
   * @param limit
   * @param offset
   */
  public async getAll(
    user: AuthenticatedUser,
    limit: number,
    offset: number
  ): Promise<PagedResult<ReleaseSummaryType>> {
    const allReleasesByUser = await releaseGetAllByUser(this.edgeDbClient, {
      userDbId: user.dbId,
      limit: limit,
      offset: offset,
    });

    // this shouldn't happen (user doesn't exist?) but if it does return no releases
    if (allReleasesByUser == null) return { data: [], total: 0 };

    return {
      total: allReleasesByUser.total,
      data: allReleasesByUser.data.map((a) => ({
        releaseKey: a.releaseKey,
        lastUpdatedDateTime: a.lastUpdated,
        lastUpdatedUserSubjectId: a.lastUpdatedSubjectId,
        datasetUris: a.datasetUris,
        applicationDacIdentifierSystem: a.applicationDacIdentifier.system,
        applicationDacIdentifierValue: a.applicationDacIdentifier.value,
        applicationDacTitle: a.applicationDacTitle,
        // running jobs are only really a concern for admins so only they find out this info (not that it really matters)
        isRunningJobPercentDone:
          a.role === "Administrator" && a.runningJob.length > 0
            ? a.runningJob[0].percentDone
            : undefined,
        isRunningJobBadge:
          a.role === "Administrator" && a.runningJob.length > 0
            ? jobAsBadgeLabel(a.runningJob[0])
            : undefined,
        isActivated: a.activation != null,
        // If this exist in this results but null is returned,
        // it means this user is an AdminView as the query have considered this.
        roleInRelease: (a.role ?? "AdminView") as UserRoleInRelease,
      })),
    };
  }

  /**
   * Get a single release.
   *
   * @param user
   * @param releaseKey
   */
  public async get(
    user: AuthenticatedUser,
    releaseKey: string
  ): Promise<ReleaseDetailType | null> {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    await this.createReleaseViewAuditEvent(user, releaseKey);

    return await this.getBase(releaseKey, userRole);
  }

  /**
   * Create a new release using user input.
   *
   * @param user
   * @param release
   */
  public async new(
    user: AuthenticatedUser,
    release: ReleaseManualType
  ): Promise<string> {
    const dbUser = await this.userData.getDbUser(this.edgeDbClient, user);

    if (!dbUser.isAllowedCreateRelease) throw new ReleaseCreateError();

    const otherResearchers = splitUserEmails(release.applicantEmailAddresses);

    otherResearchers.forEach((r) =>
      checkValidApplicationUser(r, "collaborator")
    );

    const releaseKey = await getNextReleaseKey(
      this.settings.releaseKeyPrefix
    ).run(this.edgeDbClient);

    const releaseRow = await e
      .insert(e.release.Release, {
        lastUpdatedSubjectId: user.subjectId,
        applicationDacTitle: release.releaseTitle,
        applicationDacIdentifier: e.tuple({
          system: this.settings.httpHosting.host,
          value: releaseKey,
        }),
        applicationDacDetails: `
#### Source

This application was manually created via Elsa Data on ${format(
          new Date(),
          "dd/MM/yyyy"
        )}.

#### Summary

##### Description

${release.releaseDescription}

##### Applicant
~~~
${release.applicantEmailAddresses}
~~~
`,
        applicationCoded: e.insert(e.release.ApplicationCoded, {
          studyType: release.studyType,
          countriesInvolved: [],
          diseasesOfStudy: [],
          studyAgreesToPublish: false,
          studyIsNotCommercial: false,
          beaconQuery: {},
        }),
        releaseKey: releaseKey,
        releasePassword: generateZipPassword(),
        datasetUris: release.datasetUris,
        datasetCaseUrisOrderPreference: [],
        datasetSpecimenUrisOrderPreference: [],
        datasetIndividualUrisOrderPreference: [],
        isAllowedReadData: true,
        isAllowedVariantData: true,
        isAllowedPhenotypeData: true,
        dataSharingConfiguration: e.insert(
          e.release.DataSharingConfiguration,
          {}
        ),
      })
      .run(this.edgeDbClient);

    for (const r of otherResearchers) {
      await insertPotentialOrReal(
        this.edgeDbClient,
        r,
        r.role,
        releaseRow.id,
        releaseKey,
        this.auditEventService
      );
    }

    await this.userService.registerRoleInRelease(
      user,
      releaseKey,
      "Administrator"
    );

    return releaseKey;
  }

  /**
   * Get the password of a single release.
   * Note: this is not a super secret secret - this is just to add a light layer of
   * protection to artifacts/manifest downloaded from Elsa.
   *
   * @param user
   * @param releaseKey
   */
  public async getPassword(
    user: AuthenticatedUser,
    releaseKey: string
  ): Promise<string | null> {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    return await this.auditEventService.transactionalReadInReleaseAuditPattern(
      user,
      releaseKey,
      `Access the release password: ${releaseKey}`,
      async () => {
        if (userRole !== "Member" && userRole !== "Manager") {
          throw new ReleaseViewError(releaseKey);
        }
      },

      async (tx, a) => {
        const { releaseInfo } = await getReleaseInfo(tx, releaseKey);
        return releaseInfo.releasePassword;
      },
      async (p) => {
        return p;
      },
      true
    );
  }

  /**
   * Gets a value from the auto incrementing counter.
   *
   * @param user
   * @param releaseKey
   */
  public async getIncrementingCounter(
    user: AuthenticatedUser,
    releaseKey: string
  ): Promise<number> {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    // this integer is actually global to the db - so we don't need specific
    // permissions into a release...

    return await releaseGetCounterNext(this.edgeDbClient);
  }

  public async addDiseaseToApplicationCoded(
    user: AuthenticatedUser,
    releaseKey: string,
    system: string,
    code: string
  ): Promise<ReleaseDetailType> {
    return await this.alterApplicationCodedArrayEntry(
      user,
      releaseKey,
      "diseases",
      system,
      code,
      false
    );
  }

  public async removeDiseaseFromApplicationCoded(
    user: AuthenticatedUser,
    releaseKey: string,
    system: string,
    code: string
  ): Promise<ReleaseDetailType> {
    return await this.alterApplicationCodedArrayEntry(
      user,
      releaseKey,
      "diseases",
      system,
      code,
      true
    );
  }

  public async addCountryToApplicationCoded(
    user: AuthenticatedUser,
    releaseKey: string,
    system: string,
    code: string
  ): Promise<ReleaseDetailType> {
    return await this.alterApplicationCodedArrayEntry(
      user,
      releaseKey,
      "countries",
      system,
      code,
      false
    );
  }

  public async removeCountryFromApplicationCoded(
    user: AuthenticatedUser,
    releaseKey: string,
    system: string,
    code: string
  ): Promise<ReleaseDetailType> {
    return await this.alterApplicationCodedArrayEntry(
      user,
      releaseKey,
      "countries",
      system,
      code,
      true
    );
  }

  public async setTypeOfApplicationCoded(
    user: AuthenticatedUser,
    releaseKey: string,
    type: "HMB" | "DS" | "CC" | "GRU" | "POA"
  ): Promise<ReleaseDetailType> {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    const actionDescription = "set application coded type";

    return await this.auditEventService.transactionalUpdateInReleaseAuditPattern(
      user,
      releaseKey,
      actionDescription,
      async () => {
        if (userRole != "Administrator")
          throw new ReleaseSelectionPermissionError(releaseKey);
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
        if (!releaseWithAppCoded) throw new ReleaseDisappearedError(releaseKey);

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

        return {
          studyType: type,
        };
      },
      async () => {
        return await this.getBase(releaseKey, userRole);
      }
    );
  }

  public async setBeaconQuery(
    user: AuthenticatedUser,
    releaseKey: string,
    query: any
  ): Promise<ReleaseDetailType> {
    const { userRole, isActivated } =
      await this.getBoundaryInfoWithThrowOnFailure(user, releaseKey);

    return await this.auditEventService.transactionalUpdateInReleaseAuditPattern(
      user,
      releaseKey,
      "set beacon query",
      async () => {
        if (userRole != "Administrator")
          throw new ReleaseSelectionPermissionError(releaseKey);

        if (isActivated)
          throw new ReleaseNoEditingWhilstActivatedError(releaseKey);
      },
      async (tx, a) => {
        // TODO JSON schema the query once the becaon v2 spec is stable
        await this.edgeDbClient.transaction(async (tx) => {
          // get the current coded application
          const releaseWithAppCoded = await e
            .select(e.release.Release, (r) => ({
              applicationCoded: true,
              filter: e.op(r.releaseKey, "=", releaseKey),
            }))
            .assert_single()
            .run(tx);

          if (!releaseWithAppCoded)
            throw new ReleaseDisappearedError(releaseKey);

          await e
            .update(e.release.ApplicationCoded, (ac) => ({
              filter: e.op(
                ac.id,
                "=",
                e.uuid(releaseWithAppCoded.applicationCoded.id)
              ),
              set: {
                beaconQuery: query,
              },
            }))
            .run(tx);
        });
        return query;
      },
      async () => {
        return await this.getBase(releaseKey, userRole);
      }
    );
  }

  /**
   * Change the 'is allowed' status of one of the is allowed fields in the release.
   *
   * @param user the user performing the action
   * @param releaseKey the key of the release
   * @param type the type of isAllowed field to be changed
   * @param value the boolean value to set
   *
   * Note: this is an arbitrary grouping of a set of otherwise identical service
   * level operations into a single function. This could have been split in
   * multiple functions.
   */
  public async setIsAllowed(
    user: AuthenticatedUser,
    releaseKey: string,
    type:
      | "isAllowedReadData"
      | "isAllowedVariantData"
      | "isAllowedPhenotypeData"
      | "isAllowedS3Data"
      | "isAllowedGSData"
      | "isAllowedR2Data",
    value: boolean
  ): Promise<ReleaseDetailType> {
    const { userRole, isActivated } =
      await this.getBoundaryInfoWithThrowOnFailure(user, releaseKey);

    return await this.auditEventService.transactionalUpdateInReleaseAuditPattern(
      user,
      releaseKey,
      "set isAllowed in the release",
      async () => {
        if (userRole != "Administrator")
          throw new ReleaseSelectionPermissionError(releaseKey);

        if (isActivated)
          throw new ReleaseNoEditingWhilstActivatedError(releaseKey);
      },
      async (tx, a) => {
        // map the booleans fields to the clause needed in edgedb
        // (acts as a protection from passing arbitrary strings into edgedb)
        const fieldToSet = {
          isAllowedReadData: {
            isAllowedReadData: value,
          },
          isAllowedVariantData: {
            isAllowedVariantData: value,
          },
          isAllowedPhenotypeData: {
            isAllowedPhenotypeData: value,
          },
          isAllowedS3Data: {
            isAllowedS3Data: value,
          },
          isAllowedGSData: {
            isAllowedGSData: value,
          },
          isAllowedR2Data: { isAllowedR2Data: value },
        }[type];

        await this.edgeDbClient.transaction(async (tx) => {
          await e
            .update(e.release.Release, (r) => ({
              filter_single: e.op(r.releaseKey, "=", releaseKey),
              set: fieldToSet,
            }))
            .run(tx);
        });

        return {
          field: type,
          newValue: value,
        };
      },
      async () => {
        return await this.getBase(releaseKey, userRole);
      }
    );
  }

  /**
   * Change any of the data sharing configuration fields.
   *
   * @param user the user performing the action
   * @param releaseKey the key of the release
   * @param type the type of data sharing configuration field to be changed
   * @param value the boolean/string/number value to set
   */
  public async setDataSharingConfigurationField(
    user: AuthenticatedUser,
    releaseKey: string,
    // NOTE these strings match the patch operations/types as listed in schemas-release-operations.ts
    type:
      | "/dataSharingConfiguration/objectSigningEnabled"
      | "/dataSharingConfiguration/objectSigningExpiryHours"
      | "/dataSharingConfiguration/copyOutEnabled"
      | "/dataSharingConfiguration/copyOutDestinationLocation"
      | "/dataSharingConfiguration/htsgetEnabled"
      | "/dataSharingConfiguration/awsAccessPointEnabled"
      | "/dataSharingConfiguration/awsAccessPointName"
      | "/dataSharingConfiguration/gcpStorageIamEnabled"
      | "/dataSharingConfiguration/gcpStorageIamUsers",
    value: any
  ): Promise<ReleaseDetailType> {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    return await this.auditEventService.transactionalUpdateInReleaseAuditPattern(
      user,
      releaseKey,
      "Updated Data Sharing Configuration field",
      async () => {
        if (
          userRole != "Administrator" &&
          userRole != "Manager" &&
          userRole != "Member"
        )
          throw new ReleaseSelectionPermissionError(releaseKey);

        // TODO permission checks depending on the field type
        //egif (
        ///        type === "isAllowedHtsget" &&
        //     this.configForFeature("isAllowedHtsget") === undefined
        // ) {
        //   throw new ReleaseHtsgetNotConfigured();
        // }
      },
      async (tx, a) => {
        let fieldToSet: any = undefined;

        // this switch matches the operation type to the corresponding database field to set
        // - which in general should be the same name - but we do have the flexibility here to adapt
        // to multiple fields / renamed fields etc
        // we add EdgeDb type coercions to make sure our input value is correct
        // for the corresponding operation type
        switch (type) {
          case "/dataSharingConfiguration/objectSigningEnabled":
            fieldToSet = {
              objectSigningEnabled: e.bool(value),
            };
            break;
          case "/dataSharingConfiguration/objectSigningExpiryHours":
            fieldToSet = {
              objectSigningExpiryHours: e.int16(value),
            };
            break;
          case "/dataSharingConfiguration/copyOutEnabled":
            fieldToSet = {
              copyOutEnabled: e.bool(value),
            };
            break;
          case "/dataSharingConfiguration/copyOutDestinationLocation":
            fieldToSet = {
              copyOutDestinationLocation: e.str(value),
            };
            break;
          case "/dataSharingConfiguration/htsgetEnabled":
            fieldToSet = {
              htsgetEnabled: e.bool(value),
            };
            break;
          case "/dataSharingConfiguration/awsAccessPointEnabled":
            fieldToSet = {
              awsAccessPointEnabled: e.bool(value),
            };
            break;
          case "/dataSharingConfiguration/awsAccessPointEnabled":
            fieldToSet = {
              awsAccessPointEnabled: e.bool(value),
            };
            break;
          case "/dataSharingConfiguration/awsAccessPointName":
            fieldToSet = {
              awsAccessPointName: e.str(value),
            };
            break;
          case "/dataSharingConfiguration/gcpStorageIamEnabled":
            fieldToSet = {
              gcpStorageIamEnabled: e.bool(value),
            };
            break;
          case "/dataSharingConfiguration/gcpStorageIamUsers":
            fieldToSet = {
              gcpStorageIamUsers: e.array(value),
            };
            break;
          default:
            throw new Error(
              `setDataSharingConfigurationField passed in unknown field type to set '${type}'`
            );
        }

        await this.edgeDbClient.transaction(async (tx) => {
          await e
            .update(e.release.Release.dataSharingConfiguration, (dsc) => ({
              filter_single: e.op(
                dsc["<dataSharingConfiguration[is release::Release]"]
                  .releaseKey,
                "=",
                releaseKey
              ),
              set: fieldToSet,
            }))
            .run(tx);
        });

        return {
          field: type,
          newValue: value,
        };
      },
      async () => {
        return await this.getBase(releaseKey, userRole);
      }
    );
  }

  async htsgetRestrictionsFn(
    user: AuthenticatedUser,
    releaseKey: string,
    restriction: "CongenitalHeartDefect" | "Autism" | "Achromatopsia",
    actionDescription: string,
    restrictionFn: (
      client: Executor,
      args: {
        userDbId: string;
        releaseKey: string;
        restriction: string;
      }
    ) => Promise<{ id: string } | null>
  ) {
    const { auditEventId, auditEventStart } = await auditReleaseUpdateStart(
      this.auditEventService,
      this.edgeDbClient,
      user,
      releaseKey,
      actionDescription
    );

    await this.edgeDbClient.transaction(async (tx) => {
      await restrictionFn(this.edgeDbClient, {
        userDbId: user.dbId,
        releaseKey,
        restriction,
      });

      await auditSuccess(
        this.auditEventService,
        tx,
        auditEventId,
        auditEventStart,
        { restriction }
      );
    });
  }

  public async applyHtsgetRestriction(
    user: AuthenticatedUser,
    releaseKey: string,
    restriction: "CongenitalHeartDefect" | "Autism" | "Achromatopsia"
  ): Promise<ReleaseDetailType> {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    if (userRole != "Administrator")
      throw new ReleaseSelectionPermissionError(releaseKey);

    let info = await this.getBase(releaseKey, userRole);
    if (!info.dataSharingHtsgetRestrictions.includes(restriction)) {
      await this.htsgetRestrictionsFn(
        user,
        releaseKey,
        restriction,
        "Applied htsget restriction",
        applyHtsgetRestriction
      );
    }

    return await this.getBase(releaseKey, userRole);
  }

  public async removeHtsgetRestriction(
    user: AuthenticatedUser,
    releaseKey: string,
    restriction: "CongenitalHeartDefect" | "Autism" | "Achromatopsia"
  ): Promise<ReleaseDetailType> {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    if (userRole != "Administrator")
      throw new ReleaseSelectionPermissionError(releaseKey);

    let info = await this.getBase(releaseKey, userRole);
    if (info.dataSharingHtsgetRestrictions.includes(restriction)) {
      await this.htsgetRestrictionsFn(
        user,
        releaseKey,
        restriction,
        "Removed htsget restriction",
        removeHtsgetRestriction
      );
    }

    return await this.getBase(releaseKey, userRole);
  }
}
