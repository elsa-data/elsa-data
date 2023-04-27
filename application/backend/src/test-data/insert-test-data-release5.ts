import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import {
  makeEmptyCodeArray,
  makeSystemlessIdentifier,
} from "./test-data-helpers";
import { GS_URI } from "./insert-test-data-gs";
import { TEST_SUBJECT_3 } from "./insert-test-users";

const edgeDbClient = edgedb.createClient();

export async function insertRelease5() {
  return await e
    .insert(e.release.Release, {
      lastUpdatedSubjectId: TEST_SUBJECT_3,
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
      datasetUris: e.array([GS_URI]),
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
}
