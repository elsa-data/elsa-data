import * as edgedb from "edgedb";
import { Duration } from "edgedb";
import e from "../../dbschema/edgeql-js";
import {
  findSpecimenQuery,
  makeDoubleCodeArray,
  makeIdentifierTuple,
  makeSingleCodeArray,
} from "./test-data-helpers";
import { TENG_URI } from "./insert-test-data-10g";
import { TENC_URI } from "./insert-test-data-10c";
import { random } from "lodash";
import {
  BART_SPECIMEN,
  HOMER_SPECIMEN,
  MARGE_BAI_S3,
  MARGE_BAM_S3,
  MARGE_SPECIMEN,
} from "./insert-test-data-10f-simpsons";
import { ELROY_SPECIMEN } from "./insert-test-data-10f-jetsons";
import { TENF_URI } from "./insert-test-data-10f-helpers";
import * as MOCK_JSON from "./mock-json.json";
import { container } from "tsyringe";
import { ElsaSettings } from "../config/elsa-settings";
import {
  TEST_SUBJECT_2,
  TEST_SUBJECT_2_DISPLAY,
  TEST_SUBJECT_3,
  TEST_SUBJECT_3_DISPLAY,
} from "./insert-test-users";
import { getNextReleaseKey } from "../business/db/release-queries";

const edgeDbClient = edgedb.createClient();

export async function insertRelease1() {
  const settings = container.resolve<ElsaSettings>("Settings");

  return await e
    .insert(e.release.Release, {
      applicationDacTitle: "A Study of Lots of Test Data",
      applicationDacIdentifier: makeIdentifierTuple(
        "https://rems.australiangenomics.org.au",
        "56"
      ),
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

#### A table

| a | b |
| - | - |
| 4 | 5 |
`,
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        studyType: "DS",
        countriesInvolved: makeSingleCodeArray(
          settings.isoCountrySystemUri,
          "AUS"
        ),
        diseasesOfStudy: makeDoubleCodeArray(
          settings.mondoSystem.uri,
          "MONDO:0008678",
          settings.mondoSystem.uri,
          "MONDO:0021531"
        ),
        studyAgreesToPublish: true,
        studyIsNotCommercial: true,
        beaconQuery: {},
      }),
      //
      //
      // B5MN76L3BN
      //
      //
      releaseKey: `R001`,
      activation: e.insert(e.release.Activation, {
        activatedAt: e.datetime(new Date(2022, 9, 12, 4, 2, 5)),
        activatedById: TEST_SUBJECT_2,
        activatedByDisplayName: TEST_SUBJECT_2_DISPLAY,
        manifest: e.json({}),
        manifestEtag: "123456",
      }),
      previouslyActivated: e.set(
        e.insert(e.release.Activation, {
          activatedAt: e.datetime(new Date(2022, 6, 7)),
          activatedById: TEST_SUBJECT_3,
          activatedByDisplayName: TEST_SUBJECT_3_DISPLAY,
          manifest: e.json({}),
          manifestEtag: "abcdef",
        })
      ),
      releasePassword: "abcd", // pragma: allowlist secret
      datasetUris: e.array([TENG_URI, TENF_URI, TENC_URI]),
      datasetCaseUrisOrderPreference: [""],
      datasetSpecimenUrisOrderPreference: [""],
      datasetIndividualUrisOrderPreference: [""],
      isAllowedReadData: false,
      isAllowedVariantData: true,
      isAllowedPhenotypeData: false,
      selectedSpecimens: e.set(
        // we fully select one trio
        findSpecimenQuery(BART_SPECIMEN),
        findSpecimenQuery(HOMER_SPECIMEN),
        findSpecimenQuery(MARGE_SPECIMEN),
        // and just the proband of another trio
        findSpecimenQuery(ELROY_SPECIMEN)
      ),
      releaseAuditLog: makeSytheticAuditLog(),
      dataAccessAuditLog: await makeSyntheticDataAccessLog(),
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
    details: MOCK_JSON,
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
    details: MOCK_JSON,
  });

  return e.set(
    e.insert(
      e.audit.ReleaseAuditEvent,
      makeLongOperation("Ran Dynamic Consent")
    ),
    e.insert(e.audit.ReleaseAuditEvent, makeCreate()),
    e.insert(e.audit.ReleaseAuditEvent, makeRead()),
    e.insert(e.audit.ReleaseAuditEvent, makeRead()),
    e.insert(e.audit.ReleaseAuditEvent, makeRead()),
    e.insert(e.audit.ReleaseAuditEvent, makeRead()),
    e.insert(e.audit.ReleaseAuditEvent, makeRead()),
    e.insert(e.audit.ReleaseAuditEvent, makeRead()),
    e.insert(e.audit.ReleaseAuditEvent, makeRead()),
    e.insert(e.audit.ReleaseAuditEvent, makeRead()),
    e.insert(e.audit.ReleaseAuditEvent, makeRead()),
    e.insert(e.audit.ReleaseAuditEvent, makeRead()),
    e.insert(e.audit.ReleaseAuditEvent, makeRead()),
    e.insert(e.audit.ReleaseAuditEvent, makeRead()),
    e.insert(e.audit.ReleaseAuditEvent, makeRead()),
    e.insert(e.audit.ReleaseAuditEvent, makeOperation("Selected Case")),
    e.insert(e.audit.ReleaseAuditEvent, makeOperation("Unselected Specimen")),
    e.insert(e.audit.ReleaseAuditEvent, makeOperation("Unselected Specimen"))
  );
}

const makeSyntheticDataAccessLog = async () => {
  const makeDataAccessLog = async (fileUrl: string) => {
    const fileJson = await e
      .select(e.storage.File, (f) => ({
        ...f["*"],
        filter: e.op(f.url, "ilike", `%${fileUrl}`),
      }))
      .assert_single()
      .run(edgeDbClient);

    return {
      details: e.json(fileJson),
      egressBytes: 10188721080,
      whoId: "123.123.123.123",
      whoDisplayName: "Melbourne, Australia",
      actionCategory: e.audit.ActionType.R,
      actionDescription: "Data Access",
      occurredDateTime: e.datetime(new Date()),
      outcome: 0,
    };
  };

  return e.set(
    e.insert(
      e.audit.DataAccessAuditEvent,
      await makeDataAccessLog(MARGE_BAM_S3)
    ),
    e.insert(
      e.audit.DataAccessAuditEvent,
      await makeDataAccessLog(MARGE_BAI_S3)
    )
  );
};
