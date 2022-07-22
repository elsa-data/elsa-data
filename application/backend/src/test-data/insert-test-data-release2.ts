import * as edgedb from "edgedb";
import e, { release } from "../../dbschema/edgeql-js";
import { ElsaSettings } from "../bootstrap-settings";
import { findSpecimenQuery, makeEmptyCodeArray } from "./test-data-helpers";
import ApplicationCodedStudyType = release.ApplicationCodedStudyType;

const edgeDbClient = edgedb.createClient();

export async function insertRelease2(settings: ElsaSettings) {
  const mondoUri = "http://purl.obolibrary.org/obo/mondo.owl";

  return await e
    .insert(e.release.Release, {
      applicationDacTitle: "A Better Study of Limited Test Data",
      applicationDacIdentifier: "XYZ",
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        studyType: ApplicationCodedStudyType.HMB,
        countriesInvolved: makeEmptyCodeArray(),
        diseasesOfStudy: makeEmptyCodeArray(),
        studyAgreesToPublish: true,
        studyIsNotCommercial: true,
      }),
      datasetUris: e.array([
        "urn:fdc:australiangenomics.org.au:2022:datasets/cardiac",
      ]),
      releasePassword: "bbew75CZ", // pragma: allowlist secret
      selectedSpecimens: e.set(
        findSpecimenQuery("HG1"),
        findSpecimenQuery("HG2"),
        findSpecimenQuery("HG3"),
        findSpecimenQuery("HG4")
      ),
    })
    .run(edgeDbClient);
}
