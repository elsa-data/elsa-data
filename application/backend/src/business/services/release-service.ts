import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import {
  ReleaseDetailType,
  ReleaseManualType,
  ReleaseSummaryType,
} from "@umccr/elsa-types";
import { AuthenticatedUser } from "../authenticated-user";
import _ from "lodash";
import { PagedResult } from "../../api/helpers/pagination-helpers";
import { getReleaseInfo } from "./helpers";
import { inject, injectable } from "tsyringe";
import { UserService } from "./user-service";
import { ReleaseBaseService } from "./release-base-service";
import { getNextReleaseKey } from "../db/release-queries";
import { ReleaseNoEditingWhilstActivatedError } from "../exceptions/release-activation";
import { ReleaseDisappearedError } from "../exceptions/release-disappear";
import { ElsaSettings } from "../../config/elsa-settings";
import { randomUUID } from "crypto";
import { format } from "date-fns";
import {
  applyHtsgetRestriction,
  releaseGetAllByUser,
  removeHtsgetRestriction,
} from "../../../dbschema/queries";
import { AuditLogService } from "./audit-log-service";
import {
  auditFailure,
  auditReleaseUpdateStart,
  auditSuccess,
} from "../../audit-helpers";
import { Logger } from "pino";
import { jobAsBadgeLabel } from "./jobs/job-helpers";

@injectable()
export class ReleaseService extends ReleaseBaseService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    @inject("Settings") settings: ElsaSettings,
    @inject("Features") features: ReadonlySet<string>,
    @inject("Logger") private readonly logger: Logger,
    @inject(AuditLogService) private readonly auditLogService: AuditLogService,
    @inject(UserService) userService: UserService
  ) {
    super(settings, edgeDbClient, features, userService);
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
        roleInRelease: a.role!,
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

    return this.getBase(releaseKey, userRole);
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
    this.checkIsAllowedCreateReleases(user);

    const releaseKey = await getNextReleaseKey(
      this.settings.releaseKeyPrefix
    ).run(this.edgeDbClient);

    const releaseRow = await e
      .insert(e.release.Release, {
        lastUpdatedSubjectId: user.subjectId,
        applicationDacTitle: release.releaseTitle,
        applicationDacIdentifier: e.tuple({
          system: this.settings.host,
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
        releasePassword: randomUUID(),
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

    await UserService.addUserToReleaseWithRole(
      this.edgeDbClient,
      releaseRow.id,
      user.dbId,
      "Administrator",
      user.subjectId,
      user.displayName
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

    const { releaseInfo } = await getReleaseInfo(this.edgeDbClient, releaseKey);

    return releaseInfo.releasePassword;
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

    const { releaseQuery } = await getReleaseInfo(
      this.edgeDbClient,
      releaseKey
    );

    // TODO: this doesn't actually autoincrement .. I can't work out the typescript syntax though
    // (I'm not sure its implemented in edgedb yet AP 10 Aug)
    const next = await e
      .select(releaseQuery, (r) => ({
        counter: true,
      }))
      .assert_single()
      .run(this.edgeDbClient);

    if (!next) throw new Error("Couldn't find");

    return next.counter;
  }

  public async addDiseaseToApplicationCoded(
    user: AuthenticatedUser,
    releaseKey: string,
    system: string,
    code: string
  ): Promise<ReleaseDetailType> {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    await this.alterApplicationCodedArrayEntry(
      userRole,
      releaseKey,
      "diseases",
      system,
      code,
      false
    );

    return await this.getBase(releaseKey, userRole);
  }

  public async removeDiseaseFromApplicationCoded(
    user: AuthenticatedUser,
    releaseKey: string,
    system: string,
    code: string
  ): Promise<ReleaseDetailType> {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    await this.alterApplicationCodedArrayEntry(
      userRole,
      releaseKey,
      "diseases",
      system,
      code,
      true
    );

    return await this.getBase(releaseKey, userRole);
  }

  public async addCountryToApplicationCoded(
    user: AuthenticatedUser,
    releaseKey: string,
    system: string,
    code: string
  ): Promise<ReleaseDetailType> {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    await this.alterApplicationCodedArrayEntry(
      userRole,
      releaseKey,
      "countries",
      system,
      code,
      false
    );

    return await this.getBase(releaseKey, userRole);
  }

  public async removeCountryFromApplicationCoded(
    user: AuthenticatedUser,
    releaseKey: string,
    system: string,
    code: string
  ): Promise<ReleaseDetailType> {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    await this.alterApplicationCodedArrayEntry(
      userRole,
      releaseKey,
      "countries",
      system,
      code,
      true
    );

    return await this.getBase(releaseKey, userRole);
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
    });

    return await this.getBase(releaseKey, userRole);
  }

  public async setBeaconQuery(
    user: AuthenticatedUser,
    releaseKey: string,
    query: any
  ): Promise<ReleaseDetailType> {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

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

      if (!releaseWithAppCoded) throw new ReleaseDisappearedError(releaseKey);

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

    return await this.getBase(releaseKey, userRole);
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

    const { auditEventId, auditEventStart } = await auditReleaseUpdateStart(
      this.auditLogService,
      this.edgeDbClient,
      user,
      releaseKey,
      `Updated IsAllowed boolean field`
    );

    try {
      if (isActivated)
        throw new ReleaseNoEditingWhilstActivatedError(releaseKey);

      if (!_.isBoolean(value))
        throw new Error(
          `setIsAllowed was passed a non-boolean value '${value}'`
        );

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

      if (!fieldToSet)
        throw new Error(
          `setIsAllowed passed in unknown field type to set '${type}'`
        );

      await this.edgeDbClient.transaction(async (tx) => {
        await e
          .update(e.release.Release, (r) => ({
            filter_single: e.op(r.releaseKey, "=", releaseKey),
            set: fieldToSet,
          }))
          .run(tx);

        await auditSuccess(
          this.auditLogService,
          tx,
          auditEventId,
          auditEventStart,
          {
            field: type,
            newValue: value,
          }
        );
      });

      // TODO should this be part of the transaction?
      return await this.getBase(releaseKey, userRole);
    } catch (e) {
      await auditFailure(
        this.auditLogService,
        this.edgeDbClient,
        auditEventId,
        auditEventStart,
        e
      );

      throw e;
    }
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
      | "/dataSharingConfiguration/awsAccessPointVpcId"
      | "/dataSharingConfiguration/awsAccessPointAccountId"
      | "/dataSharingConfiguration/gcpStorageIamEnabled"
      | "/dataSharingConfiguration/gcpStorageIamUsers",
    value: any
  ): Promise<ReleaseDetailType> {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    const { auditEventId, auditEventStart } = await auditReleaseUpdateStart(
      this.auditLogService,
      this.edgeDbClient,
      user,
      releaseKey,
      `Updated Data Sharing Configuration field`
    );

    // TODO permission checks depending on the field type
    //egif (
    ///        type === "isAllowedHtsget" &&
    //     this.configForFeature("isAllowedHtsget") === undefined
    // ) {
    //   throw new ReleaseHtsgetNotConfigured();
    // }

    try {
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
        case "/dataSharingConfiguration/awsAccessPointAccountId":
          fieldToSet = {
            awsAccessPointAccountId: e.str(value),
          };
          break;
        case "/dataSharingConfiguration/awsAccessPointVpcId":
          fieldToSet = {
            awsAccessPointVpcId: e.str(value),
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
              dsc["<dataSharingConfiguration[is release::Release]"].releaseKey,
              "=",
              releaseKey
            ),
            set: fieldToSet,
          }))
          .run(tx);

        await auditSuccess(
          this.auditLogService,
          tx,
          auditEventId,
          auditEventStart,
          {
            field: type,
            newValue: value,
          }
        );
      });

      return await this.getBase(releaseKey, userRole);
    } catch (e) {
      await auditFailure(
        this.auditLogService,
        this.edgeDbClient,
        auditEventId,
        auditEventStart,
        e
      );

      throw e;
    }
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

    let info = await this.getBase(releaseKey, userRole);
    if (!info.htsgetRestrictions.includes(restriction)) {
      const { auditEventId, auditEventStart } = await auditReleaseUpdateStart(
        this.auditLogService,
        this.edgeDbClient,
        user,
        releaseKey,
        "Applying htsget restriction"
      );

      await this.edgeDbClient.transaction(async (tx) => {
        await applyHtsgetRestriction(this.edgeDbClient, {
          userDbId: user.dbId,
          releaseKey,
          restriction,
        });

        await auditSuccess(
          this.auditLogService,
          tx,
          auditEventId,
          auditEventStart,
          { restriction }
        );
      });
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

    let info = await this.getBase(releaseKey, userRole);
    if (info.htsgetRestrictions.includes(restriction)) {
      const { auditEventId, auditEventStart } = await auditReleaseUpdateStart(
        this.auditLogService,
        this.edgeDbClient,
        user,
        releaseKey,
        "Removed htsget restriction"
      );

      await this.edgeDbClient.transaction(async (tx) => {
        await removeHtsgetRestriction(this.edgeDbClient, {
          userDbId: user.dbId,
          releaseKey,
          restriction,
        });

        await auditSuccess(
          this.auditLogService,
          tx,
          auditEventId,
          auditEventStart,
          { restriction }
        );
      });
    }

    return await this.getBase(releaseKey, userRole);
  }
}
