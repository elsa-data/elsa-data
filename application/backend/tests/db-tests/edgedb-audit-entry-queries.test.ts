import { Client, createClient } from "edgedb";
import e from "../../dbschema/edgeql-js";
import { blankTestData } from "../../src/test-data/util/blank-test-data";
import { insertRelease2 } from "../../src/test-data/release/insert-test-data-release2";
import {
  auditEventGetSomeByUser,
  insertSystemAuditEvent,
  insertUserAuditEvent,
  updateUserAuditEvents,
} from "../../dbschema/queries";
import { registerTypes } from "../test-dependency-injection.common";
import {
  TEST_SUBJECT_3,
  TEST_SUBJECT_3_DISPLAY,
  TEST_SUBJECT_3_EMAIL,
} from "../../src/test-data/user/insert-user3";
import { TENF_URI } from "../../src/test-data/dataset/insert-test-data-10f-helpers";

const SUBJECT_ID_1 = "subjectid1";
const SUBJECT_DISPLAY_NAME_1 = "Subject 1";
const SUBJECT_EMAIL_1 = "subject@1.com";

const SUBJECT_ID_2 = "subjectid2";
const SUBJECT_DISPLAY_NAME_2 = "Subject 2";
const SUBJECT_EMAIL_2 = "subject@2.com";

const SUBJECT_ID_3 = "subjectid3";
const SUBJECT_DISPLAY_NAME_3 = "Subject 3";
const SUBJECT_EMAIL_3 = "subject@3.com";

const testContainer = registerTypes();

describe("edgedb audit entry tests", () => {
  let edgeDbClient: Client;
  let user1: { id: string };
  let user2: { id: string };
  let user3IsAdmin: { id: string };
  let release: { id: string };
  let releaseAuditEvent: { id: string };
  let userViewAuditEvent: { id: string };
  let systemAuditEvent: { id: string };

  beforeAll(async () => {
    edgeDbClient = createClient({});
  });

  afterAll(() => {});

  beforeEach(async () => {
    await blankTestData();

    const releaseProps = {
      releaseAdministrator: [
        {
          subjectId: TEST_SUBJECT_3,
          email: TEST_SUBJECT_3_EMAIL,
          name: TEST_SUBJECT_3_DISPLAY,
        },
      ],
      releaseMember: [],
      releaseManager: [],
      datasetUris: [TENF_URI],
    };

    // inserting this release creates a ReleaseAuditEntry for the creation of the release
    release = await insertRelease2(testContainer, releaseProps);

    releaseAuditEvent = (await e
      .assert_single(e.select(e.audit.ReleaseAuditEvent, (_) => ({ id: true })))
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

    userViewAuditEvent = await insertUserAuditEvent(edgeDbClient, {
      whoId: user1.id,
      whoDisplayName: SUBJECT_DISPLAY_NAME_1,
      actionCategory: "R",
      actionDescription: "Viewed something",
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
              filter: e.op(e.uuid(userViewAuditEvent.id), "=", uae.id),
            })),
          },
        },
      }))
      .run(edgeDbClient);

    systemAuditEvent = await insertSystemAuditEvent(edgeDbClient, {
      actionCategory: "U",
      actionDescription: "Updated the system",
      details: {
        a: "a big long string",
        array: ["a", "b", "c"],
      },
    });
  });

  it("user audit events visible to those who made them", async () => {
    {
      // audit event 1 should be visible to user 1 because they created it
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        filterAuditEventDbId: userViewAuditEvent.id,
        userDbId: user1.id,
      });

      expect(result).toBeTruthy();
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(userViewAuditEvent.id);
      expect(result.data[0].actionCategory).toBe("R");
      expect(result.data[0].actionDescription).toBe("Viewed something");
      expect(result.data[0].outcome).toBe(0);
      expect(result.data[0].detailsWereTruncated).toBe(false);
      expect(result.data[0].isSystemAuditEvent).toBe(false);
      expect(result.data[0].isReleaseAuditEvent).toBe(false);
      expect(result.data[0].isUserAuditEvent).toBe(true);
    }
    {
      // audit event 1 should NOT be visible to user 2 because they had nothing to do with it
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        filterAuditEventDbId: userViewAuditEvent.id,
        userDbId: user2.id,
      });

      expect(result).toBeTruthy();
      expect(result.total).toBe(0);
    }
    {
      // audit event 1 will be visible to user 3 because they have admin rights
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        filterAuditEventDbId: userViewAuditEvent.id,
        userDbId: user3IsAdmin.id,
      });

      expect(result).toBeTruthy();
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(userViewAuditEvent.id);
    }
  });

  it("release audit events available to those in the release", async () => {
    {
      // release audit event should be visible to user 1 because they are a participant in the release
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        filterAuditEventDbId: releaseAuditEvent.id,
        userDbId: user1.id,
      });
      expect(result).toBeTruthy();
      expect(result.total).toBe(1);
      expect(result.data[0].actionCategory).toBe("C");
      expect(result.data[0].actionDescription).toBe("Created Release");
      expect(result.data[0].outcome).toBe(0);
    }
    // release audit event should not be visible to user 2 because they are not a participant in the release
    {
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        filterAuditEventDbId: releaseAuditEvent.id,
        userDbId: user2.id,
      });
      expect(result).toBeTruthy();
      expect(result.total).toBe(0);
    }
    {
      // release audit event should be visible to admins no matter what
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        filterAuditEventDbId: releaseAuditEvent.id,
        userDbId: user3IsAdmin.id,
      });
      expect(result).toBeTruthy();
      expect(result.total).toBe(1);
      expect(result.data[0].actionDescription).toBe("Created Release");
    }
  });

  it("all events available to be queried by an admin", async () => {
    {
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        userDbId: user3IsAdmin.id,
        // by passing in no "filterTypes" we expect to get ALL types back
      });

      expect(result).toBeTruthy();
      expect(result.total).toBe(3);
    }
  });

  it("json details can be limited in return value", async () => {
    {
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        userDbId: user3IsAdmin.id,
        filterAuditEventDbId: userViewAuditEvent.id,
        detailsMaxLength: 8,
      });

      expect(result).toBeTruthy();
      expect(result.total).toBe(1);
      expect(result.data[0].detailsWereTruncated).toBe(true);
      expect(result.data[0].detailsAsPrettyString).toBe('{\n    "a');
    }
  });

  it("all events can be filtered by passing in filter types", async () => {
    // user events
    {
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        userDbId: user3IsAdmin.id,
        filterTypes: ["user"],
      });

      expect(result).toBeTruthy();
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(userViewAuditEvent.id);
    }
    // release events
    {
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        userDbId: user3IsAdmin.id,
        filterTypes: ["release"],
      });

      expect(result).toBeTruthy();
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(releaseAuditEvent.id);
    }
    // system events
    {
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        userDbId: user3IsAdmin.id,
        filterTypes: ["system"],
      });

      expect(result).toBeTruthy();
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(systemAuditEvent.id);
    }
    // mix of events
    {
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        userDbId: user3IsAdmin.id,
        filterTypes: ["user", "system"],
      });

      expect(result).toBeTruthy();
      expect(result.total).toBe(2);
    }
  });

  it("all events can be filtered by action category", async () => {
    {
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        userDbId: user3IsAdmin.id,
        filterActionCategory: "R",
      });

      expect(result).toBeTruthy();
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(userViewAuditEvent.id);
    }
    {
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        userDbId: user3IsAdmin.id,
        filterActionCategory: "U",
      });

      expect(result).toBeTruthy();
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(systemAuditEvent.id);
    }
    // not expecting any Delete events
    {
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        userDbId: user3IsAdmin.id,
        filterActionCategory: "D",
      });

      expect(result).toBeTruthy();
      expect(result.total).toBe(0);
    }
  });

  it("all events can be filtered by case insensitive action description text matching", async () => {
    // case-insensitive match of some part of our view event
    {
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        userDbId: user3IsAdmin.id,
        filterActionDescriptionPattern: "%SOME%",
      });

      expect(result).toBeTruthy();
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(userViewAuditEvent.id);
    }
    // nothing will match this
    {
      const result = await auditEventGetSomeByUser(edgeDbClient, {
        userDbId: user3IsAdmin.id,
        filterActionDescriptionPattern: "%xxxxx%",
      });

      expect(result).toBeTruthy();
      expect(result.total).toBe(0);
    }
  });

  it("it should be possible to sort the returned audit events", async () => {
    const result = await auditEventGetSomeByUser(edgeDbClient, {
      userDbId: user3IsAdmin.id,
      orderByProperty: "actionDescription",
      orderAscending: true,
    });

    expect(result).toBeTruthy();
    expect(result.total).toBe(3);

    expect(result.data[0].id).toBe(releaseAuditEvent.id);
    expect(result.data[1].id).toBe(systemAuditEvent.id);
    expect(result.data[2].id).toBe(userViewAuditEvent.id);
  });

  it("update user audit events query.", async () => {
    const userAdmin = await e
      .select(e.permission.User, (_) => ({
        ...e.permission.User["*"],
        filter_single: { id: user3IsAdmin.id },
      }))
      .run(edgeDbClient);

    expect(userAdmin).toBeDefined();

    await updateUserAuditEvents(edgeDbClient, {
      subjectId: userAdmin!.subjectId,
      whoDisplayName: userAdmin!.displayName,
      actionDescription: "description",
      details: {
        role: "Administrator",
        releaseKey: "R002",
      },
    });

    const updatedUser = await e
      .select(e.permission.User, (_) => ({
        id: true,
        userAuditEvent: {
          details: true,
        },
        filter_single: { id: e.uuid(user3IsAdmin.id) },
      }))
      .run(edgeDbClient);

    expect(updatedUser).toBeDefined();
    expect(updatedUser!.userAuditEvent[0].details).toStrictEqual({
      role: "Administrator",
      releaseKey: "R002",
    });
  });
});
