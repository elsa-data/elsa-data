import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import {
  makeEmptyCodeArray,
  makeSystemlessIdentifier,
} from "./test-data-helpers";
import { TENF_URI } from "./insert-test-data-10f-helpers";
import { getNextReleaseId } from "../business/db/release-queries";

const edgeDbClient = edgedb.createClient();

export async function insertRelease2() {
  return await e
    .insert(e.release.Release, {
      applicationDacTitle:
        "Genomic Sequencing of Myxococcus Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogochensis",
      applicationDacDetails: "Some other details from the DAC",
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
      releaseIdentifier: "R002",
      releasePassword: "bbew75CZ", // pragma: allowlist secret
      isAllowedReadData: true,
      isAllowedVariantData: true,
      isAllowedPhenotypeData: true,
      selectedSpecimens: e.set(),
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
