import type { DependencyContainer } from "tsyringe";
import e from "../../../dbschema/edgeql-js";
import { getServices } from "../../di-helpers";
import {
  makeEmptyCodeArray,
  makeSystemlessIdentifier,
} from "../util/test-data-helpers";
import { type InsertReleaseProps, insertRole } from "./helpers";

export async function insertRelease8(
  dc: DependencyContainer,
  releaseProps: InsertReleaseProps,
) {
  const { edgeDbClient } = getServices(dc);
  const { releaseAdministrator, releaseManager, releaseMember, datasetUris } =
    releaseProps;

  if (releaseAdministrator.length < 1)
    throw new Error("Release has no Administrator");

  const insertRelease8 = await e
    .insert(e.release.Release, {
      lastUpdatedSubjectId: releaseAdministrator[0].subjectId,
      applicationDacTitle: "NCI Globus Data Sharing",
      applicationDacDetails:
        "An application for showcasing sharing via Globus on NCI",
      applicationDacIdentifier: makeSystemlessIdentifier(
        "APPLICATION_GLOBUS_008",
      ),
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        studyType: "HMB",
        countriesInvolved: makeEmptyCodeArray(),
        diseasesOfStudy: makeEmptyCodeArray(),
        studyAgreesToPublish: true,
        studyIsNotCommercial: true,
        beaconQuery: {},
      }),
      dataSharingConfiguration: e.insert(
        e.release.DataSharingConfiguration,
        {},
      ),
      datasetUris: datasetUris,
      datasetCaseUrisOrderPreference: [""],
      datasetSpecimenUrisOrderPreference: [""],
      datasetIndividualUrisOrderPreference: [""],
      releaseKey: `R008`,
      releasePassword: "ABCDEFGHIJKL", // pragma: allowlist secret
      selectedSpecimens: e.set(),
      isAllowedReadData: true,
      isAllowedVariantData: true,
      isAllowedPhenotypeData: true,
      isAllowedNciGlobusData: true,
      releaseAuditLog: e.set(
        e.insert(e.audit.ReleaseAuditEvent, {
          actionCategory: "C",
          actionDescription: "Created Release",
          outcome: 0,
          whoDisplayName: "Maxwell Smart",
          whoId: "max@control.com",
          occurredDateTime: e.datetime_current(),
          inProgress: false,
        }),
      ),
    })
    .run(edgeDbClient);

  // Inserting user roles assign to this release
  for (const user of releaseAdministrator) {
    await insertRole(
      insertRelease8.id,
      user.email,
      "Administrator",
      edgeDbClient,
    );
  }
  for (const user of releaseManager) {
    await insertRole(insertRelease8.id, user.email, "Manager", edgeDbClient);
  }
  for (const user of releaseMember) {
    await insertRole(insertRelease8.id, user.email, "Member", edgeDbClient);
  }

  return insertRelease8;
}
