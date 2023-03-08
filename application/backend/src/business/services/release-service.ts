import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import {
  DuoLimitationCodedType,
  ReleaseCaseType,
  ReleaseDetailType,
  ReleaseManualType,
  ReleaseNodeStatusType,
  ReleasePatientType,
  ReleaseSpecimenType,
  ReleaseSummaryType,
} from "@umccr/elsa-types";
import { AuthenticatedUser } from "../authenticated-user";
import { isObjectLike, isSafeInteger } from "lodash";
import {
  createPagedResult,
  PagedResult,
} from "../../api/helpers/pagination-helpers";
import {
  collapseExternalIds,
  doRoleInReleaseCheck,
  getReleaseInfo,
} from "./helpers";
import { inject, injectable } from "tsyringe";
import { UsersService } from "./users-service";
import { ReleaseBaseService } from "./release-base-service";
import { getNextReleaseId, touchRelease } from "../db/release-queries";
import { $DatasetCase } from "../../../dbschema/edgeql-js/modules/dataset";
import etag from "etag";
import {
  ReleaseActivationPermissionError,
  ReleaseActivationStateError,
  ReleaseDeactivationStateError,
} from "../exceptions/release-activation";
import { ReleaseDisappearedError } from "../exceptions/release-disappear";
import { createReleaseManifest } from "./manifests/_manifest-helper";
import { ElsaSettings } from "../../config/elsa-settings";
import { randomUUID } from "crypto";
import { format } from "date-fns";
import { dataset } from "../../../dbschema/interfaces";
import { $scopify } from "../../../dbschema/edgeql-js/typesystem";
import { releaseGetAllByUser } from "../../../dbschema/queries";

@injectable()
export class ReleaseService extends ReleaseBaseService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings,
    usersService: UsersService
  ) {
    super(edgeDbClient, usersService);
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
        datasetUris: a.datasetUris,
        applicationDacIdentifierSystem: a.applicationDacIdentifier.system,
        applicationDacIdentifierValue: a.applicationDacIdentifier.value,
        applicationDacTitle: a.applicationDacTitle,
        isRunningJobPercentDone: undefined,
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
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
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
    const releaseKey = getNextReleaseKey(this.settings.releaseKeyPrefix);

    const releaseRow = await e
      .insert(e.release.Release, {
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
      })
      .run(this.edgeDbClient);

    await UsersService.addUserToReleaseWithRole(
      this.edgeDbClient,
      releaseRow.id,
      user.dbId,
      "Member",
      user.subjectId,
      user.displayName
    );

    return releaseRow.id;
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
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
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
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
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

  /**
   * Get all the cases for a release including checkbox status down to specimen level.
   *
   * Depending on the role of the user this will return different sets of cases.
   * (the admins will get all the cases, but researchers/pi will only see cases that they
   * have some level of visibility into)
   *
   * @param user the user asking for the cases
   * @param releaseKey the release id containing the cases
   * @param limit maximum number of cases to return (paging)
   * @param offset the offset into the cases (paging)
   * @param identifierSearchText if present, a string that must be present in any identifier within the case
   */
  public async getCases(
    user: AuthenticatedUser,
    releaseKey: string,
    limit: number,
    offset: number,
    identifierSearchText?: string
  ): Promise<PagedResult<ReleaseCaseType> | null> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseKey
    );

    const {
      releaseAllDatasetCasesQuery,
      releaseSelectedSpecimensQuery,
      releaseSelectedCasesQuery,
      datasetUriToIdMap,
    } = await getReleaseInfo(this.edgeDbClient, releaseKey);

    const datasetIdSet =
      datasetUriToIdMap.size > 0
        ? e.set(...datasetUriToIdMap.values())
        : e.cast(e.uuid, e.set());

    // we actually have to switch off the type inference (any and any) - because this ends
    // up so complex is breaks the typescript type inference depth calculations
    // (revisit on new version of tsc)
    const makeFilter = (dsc: $scopify<$DatasetCase>): any => {
      if (identifierSearchText) {
        // note that we are looking into *all* the identifiers for the case
        // BUT we are only filtering at the case level. i.e. when searching
        // by identifiers we are looking to identify at a case level - for a case
        // the includes the identifier *anywhere* (case/patient/specimen)
        return e.op(
          e.contains(
            identifierSearchText!.toUpperCase(),
            e.set(
              e.str_upper(e.array_unpack(dsc.externalIdentifiers).value),
              e.str_upper(
                e.array_unpack(dsc.patients.externalIdentifiers).value
              ),
              e.str_upper(
                e.array_unpack(dsc.patients.specimens.externalIdentifiers).value
              )
            )
          ),
          "and",
          e.op(
            e.op(dsc.dataset.id, "in", datasetIdSet),
            "and",
            e.op(
              e.bool(userRole === "DataOwner"),
              "or",
              e.op(dsc.patients.specimens, "in", releaseSelectedSpecimensQuery)
            )
          )
        );
      } else {
        // with no identifier text to search for we can return a simpler filter
        return e.op(
          e.op(dsc.dataset.id, "in", datasetIdSet),
          "and",
          e.op(
            e.bool(userRole === "DataOwner"),
            "or",
            e.op(dsc.patients.specimens, "in", releaseSelectedSpecimensQuery)
          )
        );
      }
    };

    // TODO: when the 1.0.0 EdgeDb javascript client is released we will refactor this into using
    // e.shape()
    // at the moment we have literally just duplicated the query for count() v select()

    const caseSearchQuery = e.select(e.dataset.DatasetCase, (dsc) => ({
      ...e.dataset.DatasetCase["*"],
      consent: true,
      dataset: {
        ...e.dataset.Dataset["*"],
      },
      patients: (p) => ({
        ...e.dataset.DatasetPatient["*"],
        consent: true,
        filter: e.op(
          e.bool(userRole === "DataOwner"),
          "or",
          e.op(p.specimens, "in", releaseSelectedSpecimensQuery)
        ),
        specimens: (s) => ({
          ...e.dataset.DatasetSpecimen["*"],
          consent: true,
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

    const caseCountQuery = e.count(
      e.select(e.dataset.DatasetCase, (dsc) => ({
        filter: makeFilter(dsc),
      }))
    );

    const countCases = await caseCountQuery.run(this.edgeDbClient);

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
        customConsent: isObjectLike(spec.consent),
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
        externalIdSystem: "",
        nodeStatus: calcNodeStatus(specimensMapped),
        customConsent: isObjectLike(pat.consent),
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
        externalIdSystem: "",
        fromDatasetId: cas.dataset?.id!,
        fromDatasetUri: cas.dataset?.uri!,
        nodeStatus: calcNodeStatus(patientsMapped),
        customConsent: isObjectLike(cas.consent),
        patients: patientsMapped,
      };
    };

    return createPagedResult(
      pageCases.map((pc) =>
        createCaseMap(pc as unknown as dataset.DatasetCase)
      ),
      countCases
    );
  }

  /**
   * Return the set of consent statements present in the database for any given
   * case/individual/biosample.
   *
   * @param user
   * @param releaseKey
   * @param nodeId
   */
  public async getNodeConsent(
    user: AuthenticatedUser,
    releaseKey: string,
    nodeId: string
  ): Promise<DuoLimitationCodedType[]> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseKey
    );

    const { datasetIdToUriMap } = await getReleaseInfo(
      this.edgeDbClient,
      releaseKey
    );

    const nodeFromValidDatasetsQuery = e
      .select(e.dataset.DatasetShareable, (s) => ({
        id: true,
        datasetCase: s.is(e.dataset.DatasetCase).dataset,
        datasetPatient: s.is(e.dataset.DatasetPatient).dataset,
        datasetSpecimen: s.is(e.dataset.DatasetSpecimen).dataset,
        consent: {
          statements: {
            ...e.is(e.consent.ConsentStatementDuo, { dataUseLimitation: true }),
          },
        },
        filter: e.op(s.id, "=", e.uuid(nodeId)),
      }))
      .assert_single();

    const actualNode = await nodeFromValidDatasetsQuery.run(this.edgeDbClient);

    // so we have picked the node and its consent from the db - but at this point we have
    // not established the node consent is allowed to be viewed.. so we do some non-db
    // logic here to work that out

    // if the nodeId isn't even in the db then we get no result and can safely return
    // empty consent TODO: consider error exception here
    if (!actualNode) return [];

    // it is not necessary that every node in a dataset actually has consent records - in
    // which case we can just return nothing TODO: do we want to distinguish null from []?
    if (!actualNode.consent) return [];

    // it is possible that someone has send us a nodeId that isn't in this releases datasets..
    // we shouldn't leak info
    if (actualNode.datasetCase)
      if (!datasetIdToUriMap.has(actualNode.datasetCase.id)) return [];

    if (actualNode.datasetPatient)
      if (!datasetIdToUriMap.has(actualNode.datasetPatient.id)) return [];

    if (actualNode.datasetSpecimen)
      if (!datasetIdToUriMap.has(actualNode.datasetSpecimen.id)) return [];

    return actualNode.consent.statements.map(
      (stmt) => stmt.dataUseLimitation as DuoLimitationCodedType
    );
  }

  public async setMasterAccess(
    user: AuthenticatedUser,
    releaseKey: string,
    start?: Date,
    end?: Date
  ): Promise<void> {}

  public async setSelected(
    user: AuthenticatedUser,
    releaseKey: string,
    specimenIds: string[] = []
  ): Promise<any | null> {
    return await this.setSelectedStatus(user, true, releaseKey, specimenIds);
  }

  public async setUnselected(
    user: AuthenticatedUser,
    releaseKey: string,
    specimenIds: string[] = []
  ): Promise<any | null> {
    return await this.setSelectedStatus(user, false, releaseKey, specimenIds);
  }

  public async addDiseaseToApplicationCoded(
    user: AuthenticatedUser,
    releaseKey: string,
    system: string,
    code: string
  ): Promise<ReleaseDetailType> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
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
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
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
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
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
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
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
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
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
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
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
   * @param user
   * @param releaseKey
   * @param type
   * @param value
   */
  public async setIsAllowed(
    user: AuthenticatedUser,
    releaseKey: string,
    type: "read" | "variant" | "phenotype",
    value: boolean
  ): Promise<ReleaseDetailType> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseKey
    );

    const fieldToSet =
      type === "read"
        ? {
            isAllowedReadData: value,
          }
        : type === "variant"
        ? {
            isAllowedVariantData: value,
          }
        : {
            isAllowedPhenotypeData: value,
          };

    await this.edgeDbClient.transaction(async (tx) => {
      await e
        .update(e.release.Release, (r) => ({
          filter: e.op(r.releaseKey, "=", releaseKey),
          set: fieldToSet,
        }))
        .run(tx);

      await touchRelease.run(tx, { releaseKey: releaseKey });
    });

    return await this.getBase(releaseKey, userRole);
  }

  /**
   * For the current state of a release, 'activate' it which means to switch
   * on all necessary flags that enable actual data sharing.
   *
   * @param user
   * @param releaseKey
   * @protected
   */
  public async activateRelease(user: AuthenticatedUser, releaseKey: string) {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseKey
    );

    if (userRole !== "DataOwner") {
      // TODO: replace with real error class
      throw new Error("must be a data owner");
    }

    await this.edgeDbClient.transaction(async (tx) => {
      const { releaseInfo } = await getReleaseInfo(tx, releaseKey);

      if (!releaseInfo) throw new ReleaseDisappearedError(releaseKey);

      if (releaseInfo.activation)
        throw new ReleaseActivationStateError(releaseKey);

      const manifest = await createReleaseManifest(
        tx,
        releaseKey,
        releaseInfo.isAllowedReadData,
        releaseInfo.isAllowedVariantData
      );

      await e
        .update(e.release.Release, (r) => ({
          filter: e.op(r.releaseKey, "=", releaseKey),
          set: {
            activation: e.insert(e.release.Activation, {
              activatedById: user.subjectId,
              activatedByDisplayName: user.displayName,
              manifest: e.json(manifest),
              manifestEtag: etag(JSON.stringify(manifest)),
            }),
          },
        }))
        .run(tx);

      await touchRelease.run(tx, { releaseKey: releaseKey });
    });
  }

  public async deactivateRelease(user: AuthenticatedUser, releaseKey: string) {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseKey
    );

    if (userRole !== "DataOwner") {
      throw new ReleaseActivationPermissionError(releaseKey);
    }

    await this.edgeDbClient.transaction(async (tx) => {
      const { releaseInfo } = await getReleaseInfo(tx, releaseKey);

      if (!releaseInfo) throw new Error("release has disappeared");

      if (!releaseInfo.activation)
        throw new ReleaseDeactivationStateError(releaseKey);

      await e
        .update(e.release.Release, (r) => ({
          filter: e.op(r.releaseKey, "=", releaseKey),
          set: {
            previouslyActivated: { "+=": r.activation },
            activation: null,
          },
        }))
        .run(tx);

      await touchRelease.run(tx, { releaseKey: releaseKey });
    });
  }
}
