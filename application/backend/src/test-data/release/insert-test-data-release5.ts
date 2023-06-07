import e from "../../../dbschema/edgeql-js";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";
import {
  makeEmptyCodeArray,
  makeSystemlessIdentifier,
} from "../util/test-data-helpers";
import { InsertReleaseProps, insertRole } from "./helpers";

export async function insertRelease5(
  dc: DependencyContainer,
  releaseProps: InsertReleaseProps
) {
  const { edgeDbClient } = getServices(dc);
  const { releaseAdministrator, releaseManager, releaseMember, datasetUris } =
    releaseProps;

  if (releaseAdministrator.length < 1)
    throw new Error("Release has no Administrator");

  const insertRelease5 = await e
    .insert(e.release.Release, {
      lastUpdatedSubjectId: releaseAdministrator[0].subject_id,
      applicationDacTitle: "A Working Release of Data on Google Storage",
      applicationDacDetails:
        "A release that has all working/matching files in Google Storage - so can do actual sharing",
      applicationDacIdentifier: makeSystemlessIdentifier("GS"),
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        studyType: "HMB",
        countriesInvolved: makeEmptyCodeArray(),
        diseasesOfStudy: makeEmptyCodeArray(),
        studyAgreesToPublish: true,
        studyIsNotCommercial: true,
        beaconQuery: {
          filters: [
            //{
            //    "scope": "biosamples",
            //    "id": "HP:0002664",
            //    "includeDescendantTerms": true,
            //    "similarity": "exact"
            //},
            {
              scope: "individuals",
              id: "sex",
              operator: "=",
              value: "male",
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
      dataSharingConfiguration: e.insert(
        e.release.DataSharingConfiguration,
        {}
      ),
      datasetUris: datasetUris,
      datasetCaseUrisOrderPreference: [""],
      datasetSpecimenUrisOrderPreference: [""],
      datasetIndividualUrisOrderPreference: [""],
      releaseKey: `R005`,
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
      insertRelease5.id,
      user.email,
      "Administrator",
      edgeDbClient
    );
  }
  for (const user of releaseManager) {
    await insertRole(insertRelease5.id, user.email, "Manager", edgeDbClient);
  }
  for (const user of releaseMember) {
    await insertRole(insertRelease5.id, user.email, "Member", edgeDbClient);
  }

  return insertRelease5;
}
