import * as edgedb from "edgedb";
import e, { release } from "../../dbschema/edgeql-js";
import {
  findSpecimenQuery,
  makeEmptyCodeArray,
  makeSystemlessIdentifier,
} from "./test-data-helpers";
import ApplicationCodedStudyType = release.ApplicationCodedStudyType;
import { TENF_URI } from "./insert-test-data-10f";

const edgeDbClient = edgedb.createClient();

export async function insertRelease2() {
  const mondoUri = "http://purl.obolibrary.org/obo/mondo.owl";

  return await e
    .insert(e.release.Release, {
      applicationDacTitle: "A Better Study of Limited Test Data",
      applicationDacDetails: "Some other details from the DAC",
      applicationDacIdentifier: makeSystemlessIdentifier("XYZ"),
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        studyType: ApplicationCodedStudyType.HMB,
        countriesInvolved: makeEmptyCodeArray(),
        diseasesOfStudy: makeEmptyCodeArray(),
        studyAgreesToPublish: true,
        studyIsNotCommercial: true,
      }),
      datasetUris: e.array([TENF_URI]),
      datasetCaseUrisOrderPreference: [""],
      datasetSpecimenUrisOrderPreference: [""],
      datasetIndividualUrisOrderPreference: [""],
      releaseIdentifier: "A",
      releasePassword: "bbew75CZ", // pragma: allowlist secret
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
