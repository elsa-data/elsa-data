import e from "../../../dbschema/edgeql-js";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";
import {
  makeEmptyCodeArray,
  makeSystemlessIdentifier,
} from "../util/test-data-helpers";
import { InsertReleaseProps, insertRole } from "./helpers";

export async function insertRelease6(
  dc: DependencyContainer,
  releaseProps: InsertReleaseProps
) {
  const { edgeDbClient } = getServices(dc);
  const { releaseAdministrator, releaseManager, releaseMember, datasetUris } =
    releaseProps;

  if (releaseAdministrator.length < 1)
    throw new Error("Release has no Administrator");

  const insertRelease6 = await e
    .insert(e.release.Release, {
      lastUpdatedSubjectId: releaseAdministrator[0].subject_id,
      applicationDacTitle: "A Working Release of Smartie Data",
      applicationDacDetails: "The Smartie study",
      applicationDacIdentifier: makeSystemlessIdentifier("12345"),
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
        {}
      ),
      datasetUris: datasetUris,
      datasetCaseUrisOrderPreference: [""],
      datasetSpecimenUrisOrderPreference: [""],
      datasetIndividualUrisOrderPreference: [""],
      releaseKey: `R006`,
      releasePassword: "abcd", // pragma: allowlist secret
      selectedSpecimens: e.set(),
      isAllowedReadData: true,
      isAllowedVariantData: true,
      isAllowedPhenotypeData: true,
      releaseAuditLog: e.set(
        e.insert(e.audit.ReleaseAuditEvent, {
          actionCategory: "C",
          actionDescription: "Created Release",
          outcome: 0,
          whoDisplayName: "Someone",
          whoId: "a",
          occurredDateTime: e.datetime_current(),
        })
      ),
    })
    .run(edgeDbClient);

  // Inserting user roles assign to this release
  for (const user of releaseAdministrator) {
    await insertRole(
      insertRelease6.id,
      user.email,
      "Administrator",
      edgeDbClient
    );
  }
  for (const user of releaseManager) {
    await insertRole(insertRelease6.id, user.email, "Manager", edgeDbClient);
  }
  for (const user of releaseMember) {
    await insertRole(insertRelease6.id, user.email, "Member", edgeDbClient);
  }

  return insertRelease6;
}
