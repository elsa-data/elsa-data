import e from "../../../dbschema/edgeql-js";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";
import {
  makeEmptyCodeArray,
  makeSystemlessIdentifier,
} from "../util/test-data-helpers";
import { InsertReleaseProps, insertRole } from "./helpers";

export const RELEASE2_RELEASE_IDENTIFIER = "R002";
export const RELEASE2_APPLICATION_DAC_TITLE =
  "Genomic Sequencing of Myxococcus Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogochensis";
export const RELEASE2_APPLICATION_DAC_DETAILS =
  "Some other details from the DAC";

export async function insertRelease2(
  dc: DependencyContainer,
  releaseProps: InsertReleaseProps,
) {
  const { edgeDbClient } = getServices(dc);
  const { releaseAdministrator, releaseManager, releaseMember, datasetUris } =
    releaseProps;

  if (releaseAdministrator.length < 1)
    throw new Error("Release has no Administrator");

  const insertRelease2 = await e
    .insert(e.release.Release, {
      lastUpdatedSubjectId: releaseAdministrator[0].subjectId,
      applicationDacTitle: RELEASE2_APPLICATION_DAC_TITLE,
      applicationDacDetails: RELEASE2_APPLICATION_DAC_DETAILS,
      applicationDacIdentifier: makeSystemlessIdentifier("XYZ"),
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        studyType: "HMB",
        countriesInvolved: makeEmptyCodeArray(),
        diseasesOfStudy: makeEmptyCodeArray(),
        studyAgreesToPublish: true,
        studyIsNotCommercial: true,
        beaconQuery: {},
      }),
      datasetUris: datasetUris,
      datasetCaseUrisOrderPreference: [""],
      datasetSpecimenUrisOrderPreference: [""],
      datasetIndividualUrisOrderPreference: [""],
      releaseKey: RELEASE2_RELEASE_IDENTIFIER,
      releasePassword: "bbew75CZ", // pragma: allowlist secret
      isAllowedReadData: true,
      isAllowedVariantData: true,
      isAllowedPhenotypeData: true,
      selectedSpecimens: e.set(),
      dataSharingConfiguration: e.insert(
        e.release.DataSharingConfiguration,
        {},
      ),
      releaseAuditLog: e.set(
        e.insert(e.audit.ReleaseAuditEvent, {
          actionCategory: "C",
          actionDescription: "Created Release",
          outcome: 0,
          whoDisplayName: releaseProps.releaseAdministrator[0].name,
          whoId: releaseProps.releaseAdministrator[0].subjectId,
          occurredDateTime: e.datetime_current(),
          inProgress: false,
        }),
      ),
    })
    .run(edgeDbClient);

  // Inserting user roles assign to this release
  for (const user of releaseAdministrator) {
    await insertRole(
      insertRelease2.id,
      user.email,
      "Administrator",
      edgeDbClient,
    );
  }
  for (const user of releaseManager) {
    await insertRole(insertRelease2.id, user.email, "Manager", edgeDbClient);
  }
  for (const user of releaseMember) {
    await insertRole(insertRelease2.id, user.email, "Member", edgeDbClient);
  }

  return insertRelease2;
}
