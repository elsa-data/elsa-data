import * as edgedb from "edgedb";
import e, { release } from "../../dbschema/edgeql-js";
import { ElsaSettings } from "../bootstrap-settings";
import { findSpecimenQuery, makeEmptyCodeArray } from "./test-data-helpers";
import ApplicationCodedStudyType = release.ApplicationCodedStudyType;
import { TENF_URI } from "./insert-test-data-10f";

const edgeDbClient = edgedb.createClient();

export async function insertRelease4(settings: ElsaSettings) {
  return await e
    .insert(e.release.Release, {
      applicationDacTitle: "A Release With Nothing Selected By Default",
      applicationDacDetails: "Some other details from the DAC",
      applicationDacIdentifier: "XYZ",
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
