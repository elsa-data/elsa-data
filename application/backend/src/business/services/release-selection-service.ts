import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import {
  DuoLimitationCodedType,
  ReleaseCaseType,
  ReleaseDetailType,
  ReleaseNodeStatusType,
  ReleasePatientType,
  ReleaseSpecimenType,
} from "@umccr/elsa-types";
import { AuthenticatedUser } from "../authenticated-user";
import { isObjectLike, isSafeInteger } from "lodash";
import {
  createPagedResult,
  PagedResult,
} from "../../api/helpers/pagination-helpers";
import { collapseExternalIds, getReleaseInfo } from "./helpers";
import { inject, injectable } from "tsyringe";
import { UsersService } from "./users-service";
import { ReleaseBaseService } from "./release-base-service";
import { touchRelease } from "../db/release-queries";
import { $DatasetCase } from "../../../dbschema/edgeql-js/modules/dataset";
import { ElsaSettings } from "../../config/elsa-settings";
import { dataset } from "../../../dbschema/interfaces";
import { $scopify } from "../../../dbschema/edgeql-js/typesystem";
import { AuditLogService } from "./audit-log-service";
import { Logger } from "pino";
import {
  ReleaseSelectionDatasetMismatchError,
  ReleaseSelectionPermissionError,
} from "../exceptions/release-selection";
import { ReleaseNoEditingWhilstActivatedError } from "../exceptions/release-activation";
import { releaseGetSpecimenToDataSetCrossLinks } from "../../../dbschema/queries";

/**
 * The release selection service handles CRUD operations on the list of items
 * that are 'selected' for a given release. That is, the cases/patients
 * and specimens that a data owner has authorised to be released.
 */
@injectable()
export class ReleaseSelectionService extends ReleaseBaseService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("Logger") private readonly logger: Logger,
    private readonly auditLogService: AuditLogService,
    usersService: UsersService
  ) {
    super(edgeDbClient, usersService);
  }

  /**
   * Get all the cases for a release including selected status down to specimen level.
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
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
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
              e.bool(userRole === "Administrator"),
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
            e.bool(userRole === "Administrator"),
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
          e.bool(userRole === "Administrator"),
          "or",
          e.op(p.specimens, "in", releaseSelectedSpecimensQuery)
        ),
        specimens: (s) => ({
          ...e.dataset.DatasetSpecimen["*"],
          consent: true,
          isSelected: e.op(s, "in", releaseSelectedSpecimensQuery),
          filter: e.op(
            e.bool(userRole === "Administrator"),
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
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
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

  public async setSelected(
    user: AuthenticatedUser,
    releaseKey: string,
    specimenIds: string[] = []
  ): Promise<ReleaseDetailType> {
    // NOTE: we do our boundary/permission checks in the setSelectedStatus method
    return await this.setSelectedStatus(user, true, releaseKey, specimenIds);
  }

  public async setUnselected(
    user: AuthenticatedUser,
    releaseKey: string,
    specimenIds: string[] = []
  ): Promise<ReleaseDetailType> {
    // NOTE: we do our boundary/permission checks in the setSelectedStatus method
    return await this.setSelectedStatus(user, false, releaseKey, specimenIds);
  }

  /**
   * A mega function that handles altering the sharing status of a dataset node associated with our 'release'.
   *
   * @param user the user attempting the changes
   * @param releaseKey the release id of the release to alter
   * @param specimenIds the edgedb ids of specimens from datasets of our release, or an empty list if the status should be applied to all specimens in the release
   * @param statusToSet the status to set i.e. selected = true means shared, selected = false means not shared
   *
   * TODO: make this work with any node - not just specimen nodes (i.e. setStatus of patient)
   *
   * This function is responsible for ensuring the passed in identifiers are valid - so it makes sure
   * that all specimen ids are from datasets that are in this release.
   */
  private async setSelectedStatus(
    user: AuthenticatedUser,
    statusToSet: boolean,
    releaseKey: string,
    specimenIds: string[] = []
  ): Promise<ReleaseDetailType> {
    const { userRole, isActivated } =
      await this.getBoundaryInfoWithThrowOnFailure(user, releaseKey);

    let actionDescription;

    if (specimenIds && specimenIds.length > 0) {
      actionDescription = statusToSet
        ? "Set Selected Specimens"
        : "Unset Selected Specimens";
    } else {
      actionDescription = statusToSet
        ? "Select All Specimens"
        : "Unselect All Specimens";
    }

    return await this.auditLogService.transactionalUpdateInReleaseAuditPattern(
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
        // we make a query that returns specimens and whether the specimen ids belong
        // to the datasets in our release
        // we need to do this to prevent our list of valid shared specimens from being
        // infected with edgedb nodes from datasets that are not actually in our release
        const specimenDatasetLinks =
          await releaseGetSpecimenToDataSetCrossLinks(tx, {
            releaseKey: releaseKey,
            specimenIds:
              specimenIds && specimenIds.length > 0 ? specimenIds : undefined,
          });

        // interestingly - if passed in a UUID that is *not even an EdgeDb object* - the
        // UUID doesn't appear in the cross-links result at all
        // and given that we take these Ids direct from the APIs - we can't trust that
        // people won't attempt something like this
        // so we are going to do some work to establish exactly what ended up where
        const validSpecimenIds =
          specimenDatasetLinks && specimenDatasetLinks.valid
            ? specimenDatasetLinks.valid.map((scl) => scl.id)
            : [];
        const crossLinkedSpecimenIds =
          specimenDatasetLinks && specimenDatasetLinks.crossLinked
            ? specimenDatasetLinks.crossLinked.map((scl) => scl.id)
            : [];
        const invalidSpecimenIds: string[] = [];

        const recognisedSpecimenIds = new Set(
          validSpecimenIds.concat(crossLinkedSpecimenIds)
        );

        // look for anything passed into us that ended up nowhere in the edgedb query result
        for (const sid of specimenIds) {
          if (!recognisedSpecimenIds.has(sid)) {
            invalidSpecimenIds.push(sid);
          }
        }

        // we abort early here - if anything is wrong we change nothing at all
        if (
          !specimenDatasetLinks ||
          crossLinkedSpecimenIds.length > 0 ||
          invalidSpecimenIds.length > 0
        )
          throw new ReleaseSelectionDatasetMismatchError(
            releaseKey,
            crossLinkedSpecimenIds.concat(invalidSpecimenIds)
          );

        if (statusToSet) {
          // add specimens to the selected set
          await e
            .params({ ids: e.array(e.uuid) }, ({ ids }) =>
              e.update(e.release.Release, (r) => ({
                filter: e.op(r.releaseKey, "=", releaseKey),
                set: {
                  selectedSpecimens: {
                    "+=": e.select(e.dataset.DatasetSpecimen, (ds) => ({
                      filter: e.op(ds.id, "in", e.array_unpack(ids)),
                    })),
                  },
                },
              }))
            )
            .run(tx, { ids: validSpecimenIds });
        } else {
          // remove specimens from the selected set
          await e
            .params({ ids: e.array(e.uuid) }, ({ ids }) =>
              e.update(e.release.Release, (r) => ({
                filter: e.op(r.releaseKey, "=", releaseKey),
                set: {
                  selectedSpecimens: {
                    "-=": e.select(e.dataset.DatasetSpecimen, (ds) => ({
                      filter: e.op(ds.id, "in", e.array_unpack(ids)),
                    })),
                  },
                },
              }))
            )
            .run(tx, { ids: validSpecimenIds });
        }

        return {
          affectedSpecimens:
            specimenIds && specimenIds.length > 0 ? validSpecimenIds : ["*"],
        };
      },
      async (a) => {
        return await this.getBase(releaseKey, userRole);
      }
    );
  }
}
