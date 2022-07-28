import * as edgedb from "edgedb";
import e, { release } from "../../dbschema/edgeql-js";
import { insertCARDIAC } from "./insert-test-data-cardiac";
import { insert10G } from "./insert-test-data-10g";
import { ElsaSettings } from "../bootstrap-settings";
import {
  createTestUser,
  findSpecimenQuery,
  insertBlankDataset,
  makeDoubleCodeArray,
  makeEmptyCodeArray,
  makeSingleCodeArray,
  makeTripleCodeArray,
} from "./test-data-helpers";
import { insert10F } from "./insert-test-data-10f";
import { insert10C } from "./insert-test-data-10c";
import ApplicationCodedStudyType = release.ApplicationCodedStudyType;

const edgeDbClient = edgedb.createClient();

export async function insertRelease3(settings: ElsaSettings) {
  // r3 is a test release that no-one has any permissions into - so should not
  // appear in any queries
  return await e
    .insert(e.release.Release, {
      applicationDacTitle: "An Invisible Study",
      applicationDacIdentifier: "XYZ",
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        studyType: ApplicationCodedStudyType.HMB,
        countriesInvolved: makeEmptyCodeArray(),
        diseasesOfStudy: makeEmptyCodeArray(),
        studyAgreesToPublish: true,
        studyIsNotCommercial: true,
      }),
      releasePassword: "apassword", // pragma: allowlist secret
      datasetUris: e.array([
        "urn:fdc:australiangenomics.org.au:2022:datasets/cardiac",
      ]),
      datasetCaseUrisOrderPreference: [""],
      datasetSpecimenUrisOrderPreference: [""],
      datasetIndividualUrisOrderPreference: [""],
      selectedSpecimens: e.set(),
      auditLog: e.set(
        e.insert(e.audit.AuditEvent, {
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
