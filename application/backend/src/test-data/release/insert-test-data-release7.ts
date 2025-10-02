import type { DependencyContainer } from "tsyringe";
import e from "../../../dbschema/edgeql-js";
import { getServices } from "../../di-helpers";
import {
  makeEmptyCodeArray,
  makeSystemlessIdentifier,
} from "../util/test-data-helpers";
import { type InsertReleaseProps, insertRole } from "./helpers";

export async function insertRelease7(
  dc: DependencyContainer,
  releaseProps: InsertReleaseProps,
) {
  const { edgeDbClient } = getServices(dc);
  const { releaseAdministrator, releaseManager, releaseMember, datasetUris } =
    releaseProps;

  if (releaseAdministrator.length < 1)
    throw new Error("Release has no Administrator");

  const insertRelease7 = await e
    .insert(e.release.Release, {
      lastUpdatedSubjectId: releaseAdministrator[0].subjectId,
      applicationDacTitle: "Get Smart Cohort Building",
      applicationDacDetails:
        "An application for showcasing consent over two datasets",
      applicationDacIdentifier: makeSystemlessIdentifier("APPLICATION98765"),
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
      releaseKey: `R007`,
      releasePassword: "ABCDEFGHIJKL", // pragma: allowlist secret
      selectedSpecimens: e.set(),
      isAllowedReadData: true,
      isAllowedVariantData: true,
      isAllowedPhenotypeData: true,
      isAllowedS3Data: true,
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
      insertRelease7.id,
      user.email,
      "Administrator",
      edgeDbClient,
    );
  }
  for (const user of releaseManager) {
    await insertRole(insertRelease7.id, user.email, "Manager", edgeDbClient);
  }
  for (const user of releaseMember) {
    await insertRole(insertRelease7.id, user.email, "Member", edgeDbClient);
  }

  return insertRelease7;
}
