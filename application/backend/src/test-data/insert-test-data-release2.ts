import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import {
  makeEmptyCodeArray,
  makeSystemlessIdentifier,
} from "./test-data-helpers";
import { TENF_URI } from "./insert-test-data-10f-helpers";
import { TEST_SUBJECT_3 } from "./insert-test-users";

const edgeDbClient = edgedb.createClient();

export const RELEASE2_RELEASE_IDENTIFIER = "R002";
export const RELEASE2_APPLICATION_DAC_TITLE =
  "Genomic Sequencing of Myxococcus Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogochensis";
export const RELEASE2_APPLICATION_DAC_DETAILS =
  "Some other details from the DAC";

export async function insertRelease2() {
  return await e
    .insert(e.release.Release, {
      lastUpdatedSubjectId: TEST_SUBJECT_3,
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
      datasetUris: e.array([TENF_URI]),
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
        {}
      ),
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
