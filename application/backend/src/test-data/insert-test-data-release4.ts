import * as edgedb from "edgedb";
import e, { release } from "../../dbschema/edgeql-js";
import {
  findSpecimenQuery,
  makeEmptyCodeArray,
  makeSystemlessIdentifier,
} from "./test-data-helpers";
import ApplicationCodedStudyType = release.ApplicationCodedStudyType;
import { TENG_URI } from "./insert-test-data-10g";

const edgeDbClient = edgedb.createClient();

export async function insertRelease4() {
  return await e
    .insert(e.release.Release, {
      applicationDacTitle: "A Working Release of 10G Data",
      applicationDacDetails:
        "A release that has all working/matching files in S3 - so can do actual sharing",
      applicationDacIdentifier: makeSystemlessIdentifier("2"),
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        studyType: ApplicationCodedStudyType.HMB,
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
      datasetUris: e.array([TENG_URI]),
      datasetCaseUrisOrderPreference: [""],
      datasetSpecimenUrisOrderPreference: [""],
      datasetIndividualUrisOrderPreference: [""],
      releaseIdentifier: "TR",
      releasePassword: "abcd", // pragma: allowlist secret
      selectedSpecimens: e.set(),
      auditLog: e.set(
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
