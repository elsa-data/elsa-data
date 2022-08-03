import * as edgedb from "edgedb";
import e, { release } from "../../dbschema/edgeql-js";
import { ElsaSettings } from "../bootstrap-settings";
import {
  findSpecimenQuery,
  makeDoubleCodeArray,
  makeSingleCodeArray,
  makeSystemlessIdentifier,
} from "./test-data-helpers";
import ApplicationCodedStudyType = release.ApplicationCodedStudyType;
import {
  BART_SPECIMEN,
  ELROY_SPECIMEN,
  HOMER_SPECIMEN,
  MARGE_SPECIMEN,
  TENF_URI,
} from "./insert-test-data-10f";
import { TENG_URI } from "./insert-test-data-10g";
import { TENC_URI } from "./insert-test-data-10c";
import { Duration } from "edgedb";
import { random } from "lodash";

const edgeDbClient = edgedb.createClient();

export async function insertRelease1(settings: ElsaSettings) {
  const mondoUri = "http://purl.obolibrary.org/obo/mondo.owl";

  return await e
    .insert(e.release.Release, {
      applicationDacTitle: "A Study of Lots of Test Data",
      applicationDacIdentifier: makeSystemlessIdentifier("ABC"),
      applicationDacDetails: `
#### Origin

This is an application from REMS instance HGPP.

#### Purpose

We are going to take the test data and study it.

#### Ethics

Ethics form XYZ.

#### Other DAC application details

* Signed by A, B, C
* Agreed to condition Y
        `,
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        studyType: ApplicationCodedStudyType.DS,
        countriesInvolved: makeSingleCodeArray("urn:iso:std:iso:3166", "AUS"),
        diseasesOfStudy: makeDoubleCodeArray(
          mondoUri,
          "MONDO:0008678",
          mondoUri,
          "MONDO:0021531"
        ),
        studyAgreesToPublish: true,
        studyIsNotCommercial: true,
      }),
      releaseIdentifier: "MNRETQER",
      releasePassword: "aeyePEWR", // pragma: allowlist secret
      releaseStarted: new Date(2022, 1, 23),
      datasetUris: e.array([TENG_URI, TENF_URI, TENC_URI]),
      datasetCaseUrisOrderPreference: [""],
      datasetSpecimenUrisOrderPreference: [""],
      datasetIndividualUrisOrderPreference: [""],
      selectedSpecimens: e.set(
        // we fully select one trio
        findSpecimenQuery(BART_SPECIMEN),
        findSpecimenQuery(HOMER_SPECIMEN),
        findSpecimenQuery(MARGE_SPECIMEN),
        // and just the proband of another trio
        findSpecimenQuery(ELROY_SPECIMEN)
      ),
      auditLog: makeSytheticAuditLog(),
    })
    .run(edgeDbClient);
}

function makeSytheticAuditLog() {
  const makeCreate = () => ({
    actionCategory: "C" as "C",
    actionDescription: "Created Release",
    outcome: 0,
    whoDisplayName: "Someone",
    whoId: "a",
    occurredDateTime: e.op(
      e.datetime_current(),
      "-",
      e.duration(new Duration(0, 0, 0, 0, 1, 2, 3))
    ),
  });

  const makeRead = () => ({
    actionCategory: "R" as "R",
    actionDescription: "Viewed Release",
    outcome: 0,
    whoDisplayName: "Bruce Smith",
    whoId: "a",
    occurredDateTime: e.op(
      e.datetime_current(),
      "-",
      e.duration(new Duration(0, 0, 0, 0, 0, random(59), random(59)))
    ),
  });

  const makeOperation = (op: string) => ({
    actionCategory: "E" as "E",
    actionDescription: op,
    outcome: 0,
    whoDisplayName: "Bruce Smith",
    whoId: "a",
    occurredDateTime: e.op(
      e.datetime_current(),
      "-",
      e.duration(new Duration(0, 0, 0, 0, 0, random(59), random(59)))
    ),
  });

  const makeLongOperation = (op: string) => ({
    actionCategory: "E" as "E",
    actionDescription: op,
    outcome: 0,
    whoDisplayName: "Alice Smythe",
    whoId: "a",
    occurredDateTime: e.op(
      e.datetime_current(),
      "-",
      e.duration(new Duration(0, 0, 0, 0, 0, random(59), random(59)))
    ),
    occurredDuration: e.duration(
      new Duration(0, 0, 0, 0, 0, random(59), random(59))
    ),
  });

  return e.set(
    e.insert(e.audit.AuditEvent, makeCreate()),
    e.insert(e.audit.AuditEvent, makeRead()),
    e.insert(e.audit.AuditEvent, makeOperation("Selected Case")),
    e.insert(e.audit.AuditEvent, makeRead()),
    e.insert(e.audit.AuditEvent, makeRead()),
    e.insert(e.audit.AuditEvent, makeRead()),
    e.insert(e.audit.AuditEvent, makeOperation("Unselected Specimen")),
    e.insert(e.audit.AuditEvent, makeRead()),
    e.insert(e.audit.AuditEvent, makeLongOperation("Ran Dynamic Consent")),
    e.insert(e.audit.AuditEvent, makeRead()),
    e.insert(e.audit.AuditEvent, makeRead()),
    e.insert(e.audit.AuditEvent, makeRead()),
    e.insert(e.audit.AuditEvent, makeRead()),
    e.insert(e.audit.AuditEvent, makeRead()),
    e.insert(e.audit.AuditEvent, makeRead()),
    e.insert(e.audit.AuditEvent, makeRead()),
    e.insert(e.audit.AuditEvent, makeRead())
  );
}
