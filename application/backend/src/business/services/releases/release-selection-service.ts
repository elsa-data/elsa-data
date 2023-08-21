import * as edgedb from "edgedb";
import e from "../../../../dbschema/edgeql-js";
import {
  DuoLimitationCodedType,
  ReleaseCaseType,
  ReleaseDetailType,
  ReleaseNodeStatusType,
  ReleasePatientType,
  ReleaseSpecimenType,
} from "@umccr/elsa-types";
import { AuthenticatedUser } from "../../authenticated-user";
import { isEmpty, isObjectLike, isSafeInteger } from "lodash";
import {
  createPagedResult,
  PagedResult,
} from "../../../api/helpers/pagination-helpers";
import { collapseExternalIds, getReleaseInfo } from "../helpers";
import { inject, injectable } from "tsyringe";
import { UserService } from "../user-service";
import { ReleaseBaseService } from "./release-base-service";
import { $DatasetCase } from "../../../../dbschema/edgeql-js/modules/dataset";
import { ElsaSettings } from "../../../config/elsa-settings";
import { dataset } from "../../../../dbschema/interfaces";
import { $scopify } from "../../../../dbschema/edgeql-js/typesystem";
import { AuditEventService } from "../audit-event-service";
import { Logger } from "pino";
import {
  ReleaseSelectionNonExistentIdentifierError,
  ReleaseSelectionCrossLinkedIdentifierError,
  ReleaseSelectionPermissionError,
} from "../../exceptions/release-selection";
import { ReleaseNoEditingWhilstActivatedError } from "../../exceptions/release-activation";
import {
  releaseGetSpecimensByDbIdsAndExternalIdentifiers,
  releaseSelectionGetCases,
} from "../../../../dbschema/queries";
import { AuditEventTimedService } from "../audit-event-timed-service";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";

/**
 * The release selection service handles CRUD operations on the list of items
 * that are 'selected' for a given release. That is, the cases/patients
 * and specimens that an administrator has authorised to be released.
 */
@injectable()
export class ReleaseSelectionService extends ReleaseBaseService {
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
   * Get all the cases for a release including selected status down to specimen level.
   *
   * Depending on the role of the user this will return different sets of cases.
   * (the admins will get all the cases, but researchers/manager will only see cases that they
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
  ) {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    const isAllowedViewAllCases =
      userRole === "Administrator" || userRole === "AdminView";

    const casesResult = await releaseSelectionGetCases(this.edgeDbClient, {
      releaseKey: releaseKey,
      isAllowedViewAllCases: isAllowedViewAllCases,
      // it is important that we pass in undefined to mean "don't do a search"... passing in anything else
      // means that it just does a search matching on the empty string which is not the same thing
      query: isEmpty(identifierSearchText) ? undefined : identifierSearchText,
      limit: limit,
      offset: offset,
    });

    // we need to construct the result hierarchies, including computing the checkbox at intermediate nodes
    // (intermediate nodes can be "indeterminate" meaning that the children nodes are neither all selected nor all unselected)

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

    const paged = createPagedResult<ReleaseCaseType>(
      casesResult.data.map((pc) =>
        createCaseMap(pc as unknown as dataset.DatasetCase)
      ),
      casesResult.total
    );

    // extend our paged result with some extra information
    return {
      ...paged,
      totalSelectedSpecimens: casesResult.totalSelectedSpecimens,
      totalSpecimens: casesResult.totalSpecimens,
    };
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
    dbIds: string[] = [],
    externalIdentifierValues: string[] = [],
    selectAll: boolean = false
  ): Promise<ReleaseDetailType> {
    // NOTE: we do our boundary/permission checks in the setSelectedStatus method
    return await this.setSelectedStatus(
      user,
      true,
      releaseKey,
      dbIds,
      externalIdentifierValues,
      selectAll
    );
  }

  public async setUnselected(
    user: AuthenticatedUser,
    releaseKey: string,
    dbIds: string[] = [],
    externalIdentifierValues: string[] = [],
    selectAll: boolean = false
  ): Promise<ReleaseDetailType> {
    // NOTE: we do our boundary/permission checks in the setSelectedStatus method
    return await this.setSelectedStatus(
      user,
      false,
      releaseKey,
      dbIds,
      externalIdentifierValues,
      selectAll
    );
  }

  /**
   * A mega function that handles altering the sharing status of a dataset node associated with our 'release'.
   *
   * @param user the user attempting the changes
   * @param releaseKey the release id of the release to alter
   * @param identifiers the IDs from datasets of our release, or an empty list if the
   *        status should be applied to all specimens in the release. The IDs
   *        could be external patient IDs, or external specimen IDs.
   * @param statusToSet the status to set i.e. selected = true means shared,
   *        selected = false means not shared
   *
   * TODO: make this work with any node - not just specimen nodes (i.e. setStatus of patient)
   *
   * This function is responsible for ensuring the passed in identifiers are
   * valid - so it makes sure that all specimen ids are from datasets that are
   * in this release.
   */
  private async setSelectedStatus(
    user: AuthenticatedUser,
    statusToSet: boolean,
    releaseKey: string,
    dbIds: string[] = [],
    externalIdentifierValues: string[] = [],
    selectAll: boolean = false
  ): Promise<ReleaseDetailType> {
    const { userRole, isActivated } =
      await this.getBoundaryInfoWithThrowOnFailure(user, releaseKey);

    let actionDescription;

    if (selectAll) {
      actionDescription = statusToSet
        ? "Select All Specimens"
        : "Unselect All Specimens";
    } else {
      actionDescription = statusToSet
        ? "Set Selected Specimens"
        : "Unset Selected Specimens";
    }

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
        // we make a query that returns specimens and whether the specimen ids belong
        // to the datasets in our release
        // we need to do this to prevent our list of valid shared specimens from being
        // infected with edgedb nodes from datasets that are not actually in our release
        const specimenIds =
          await releaseGetSpecimensByDbIdsAndExternalIdentifiers(tx, {
            releaseKey,
            dbIds,
            externalIdentifierValues,
            selectAll,
          });

        if (specimenIds.invalidDbIds.length)
          throw new ReleaseSelectionNonExistentIdentifierError(
            specimenIds.invalidDbIds
          );

        if (
          specimenIds.crossLinkedSpecimenCount ||
          specimenIds.crossLinkedPatientCount ||
          specimenIds.crossLinkedCaseCount
        )
          throw new ReleaseSelectionCrossLinkedIdentifierError();

        const internalIdentifiers = specimenIds.specimens.map((s) => s.id);

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
            .run(tx, { ids: internalIdentifiers });
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
            .run(tx, { ids: internalIdentifiers });
        }

        return {
          affectedSpecimens: selectAll ? internalIdentifiers : ["*"],
        };
      },
      async () => {
        return await this.getBase(releaseKey, userRole);
      }
    );
  }
}
