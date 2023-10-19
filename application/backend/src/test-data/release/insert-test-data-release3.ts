import e from "../../../dbschema/edgeql-js";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";
import {
  makeEmptyCodeArray,
  makeSystemlessIdentifier,
} from "../util/test-data-helpers";
import { InsertReleaseProps, insertRole } from "./helpers";

export const RELEASE3_RELEASE_IDENTIFIER = "R003";

export async function insertRelease3(
  dc: DependencyContainer,
  releaseProps: InsertReleaseProps,
) {
  const { edgeDbClient } = getServices(dc);
  const { releaseAdministrator, releaseManager, releaseMember, datasetUris } =
    releaseProps;

  if (releaseAdministrator.length < 1)
    throw new Error("Release has no Administrator");
  // r3 is a test release that no-one has any permissions into - so should not
  // appear in any queries
  const insertRelease3 = await e
    .insert(e.release.Release, {
      lastUpdatedSubjectId: releaseAdministrator[0].subjectId,
      applicationDacTitle: "An Invisible Study",
      applicationDacIdentifier: makeSystemlessIdentifier("DEF"),
      applicationDacDetails: "",
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        studyType: "HMB",
        countriesInvolved: makeEmptyCodeArray(),
        diseasesOfStudy: makeEmptyCodeArray(),
        studyAgreesToPublish: true,
        studyIsNotCommercial: true,
        beaconQuery: {
          filters: [
            {
              id: "EFO:0001212",
              scope: "biosamples",
            },
          ],
          requestParameters: {
            g_variant: {
              referenceName: "chr1",
              start: 185194,
              referenceBases: "G",
              alternateBases: "C",
            },
          },
        },
      }),
      releasePassword: "apassword", // pragma: allowlist secret
      datasetUris: e.array([
        "urn:fdc:australiangenomics.org.au:2022:dataset/cardiac",
      ]),
      dataSharingConfiguration: e.insert(e.release.DataSharingConfiguration, {
        objectSigningEnabled: true,
      }),
      datasetCaseUrisOrderPreference: [""],
      datasetSpecimenUrisOrderPreference: [""],
      datasetIndividualUrisOrderPreference: [""],
      releaseKey: RELEASE3_RELEASE_IDENTIFIER,
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
          inProgress: false,
        }),
      ),
    })
    .run(edgeDbClient);

  // Inserting user roles assign to this release
  for (const user of releaseAdministrator) {
    await insertRole(
      insertRelease3.id,
      user.email,
      "Administrator",
      edgeDbClient,
    );
  }
  for (const user of releaseManager) {
    await insertRole(insertRelease3.id, user.email, "Manager", edgeDbClient);
  }
  for (const user of releaseMember) {
    await insertRole(insertRelease3.id, user.email, "Member", edgeDbClient);
  }

  return insertRelease3;
}
