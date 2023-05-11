import { Client, createClient } from "edgedb";
import e from "../../dbschema/edgeql-js";
import { blankTestData } from "../../src/test-data/blank-test-data";
import { insertRelease2 } from "../../src/test-data/insert-test-data-release2";
import {
  getTruncatedAuditEventDetails,
  insertSystemAuditEvent,
  insertUserAuditEvent,
} from "../../dbschema/queries";

const SUBJECT_ID_1 = "subjectid1";
const SUBJECT_DISPLAY_NAME_1 = "Subject 1";
const SUBJECT_EMAIL_1 = "subject@1.com";

const SUBJECT_ID_2 = "subjectid2";
const SUBJECT_DISPLAY_NAME_2 = "Subject 2";
const SUBJECT_EMAIL_2 = "subject@2.com";

const SUBJECT_ID_3 = "subjectid3";
const SUBJECT_DISPLAY_NAME_3 = "Subject 3";
const SUBJECT_EMAIL_3 = "subject@3.com";

describe("edgedb audit entry tests", () => {
  let edgeDbClient: Client;
  let user1: { id: string };
  let user2: { id: string };
  let user3IsAdmin: { id: string };
  let release: { id: string };
  let releaseAuditEvent: { id: string };
  let auditEvent1: { id: string };
  let auditEvent2: { id: string };

  beforeAll(async () => {
    edgeDbClient = createClient({});
  });

  afterAll(() => {});

  beforeEach(async () => {
    await blankTestData();

    // inserting this release creates a ReleaseAuditEntry for the creation of the release
    release = await insertRelease2();

    releaseAuditEvent = (await e
      .assert_single(
        e.select(e.audit.ReleaseAuditEvent, (rae) => ({ id: true }))
      )
      .run(edgeDbClient))!;

    if (!releaseAuditEvent)
      throw new Error(
        "Inserting a release should have made one release audit event - we are counting on this!"
      );

    // user 1 is participating in the release but did not create it
    user1 = await e
      .insert(e.permission.User, {
        subjectId: SUBJECT_ID_1,
        displayName: SUBJECT_DISPLAY_NAME_1,
        email: SUBJECT_EMAIL_1,
        isAllowedOverallAdministratorView: false,
        releaseParticipant: e.select(e.release.Release),
      })
      .run(edgeDbClient);

    user2 = await e
      .insert(e.permission.User, {
        subjectId: SUBJECT_ID_2,
        displayName: SUBJECT_DISPLAY_NAME_2,
        email: SUBJECT_EMAIL_2,
        isAllowedOverallAdministratorView: false,
      })
      .run(edgeDbClient);

    user3IsAdmin = await e
      .insert(e.permission.User, {
        subjectId: SUBJECT_ID_3,
        displayName: SUBJECT_DISPLAY_NAME_3,
        email: SUBJECT_EMAIL_3,
        isAllowedOverallAdministratorView: true,
      })
      .run(edgeDbClient);

    auditEvent1 = await insertUserAuditEvent(edgeDbClient, {
      whoId: user1.id,
      whoDisplayName: SUBJECT_DISPLAY_NAME_1,
      actionCategory: "C",
      actionDescription: "Did something",
      details: {
        a: "a big long string",
        array: ["a", "b", "c"],
      },
    });

    await e
      .update(e.permission.User, (u) => ({
        filter: e.op(e.uuid(user1.id), "=", u.id),
        set: {
          userAuditEvent: {
            "+=": e.select(e.audit.UserAuditEvent, (uae) => ({
              filter: e.op(e.uuid(auditEvent1.id), "=", uae.id),
            })),
          },
        },
      }))
      .run(edgeDbClient);

    auditEvent2 = await insertSystemAuditEvent(edgeDbClient, {
      actionCategory: "U",
      actionDescription: "Updated the system",
      details: {
        a: "a big long string",
        array: ["a", "b", "c"],
      },
    });
  });

  it("get of truncated details returns content if user created the event", async () => {
    const result = await getTruncatedAuditEventDetails(edgeDbClient, {
      auditEventDbId: auditEvent1.id,
      userDbId: user1.id,
    });

    console.debug(result);
  });

  it("get of truncated details returns nothing if user did not create the event", async () => {
    const result = await getTruncatedAuditEventDetails(edgeDbClient, {
      auditEventDbId: auditEvent1.id,
      userDbId: user2.id,
    });

    console.debug(result);
  });

  it("get of audit details returns content if user participates in the release the event is part of", async () => {
    const result = await getTruncatedAuditEventDetails(edgeDbClient, {
      auditEventDbId: releaseAuditEvent.id,
      userDbId: user1.id,
    });

    console.debug(result);
  });

  it("get of audit details returns nothing if user does not participate in the release the event is part of", async () => {
    const result = await getTruncatedAuditEventDetails(edgeDbClient, {
      auditEventDbId: releaseAuditEvent.id,
      userDbId: user2.id,
    });

    console.debug(result);
  });
});
