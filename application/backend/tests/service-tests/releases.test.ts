import { Client, createClient } from "edgedb";
import { blankTestData } from "../../src/test-data/blank-test-data";
import { insert10G } from "../../src/test-data/insert-test-data-10g";
import e from "../../dbschema/edgeql-js";
import { releasesService } from "../../src/business/services/releases";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { makeSystemlessIdentifier } from "../../src/test-data/insert-test-data-helpers";

describe("releases tests", () => {
  let edgeDbClient: Client;
  let testReleaseId: string;
  let allowedUser: AuthenticatedUser;
  let notAllowedUser: AuthenticatedUser;

  beforeAll(async () => {
    edgeDbClient = createClient({});
  });

  afterAll(() => {});

  beforeEach(async () => {
    await blankTestData();
    await insert10G();

    // this will change soon - it is currently wrong to match some other code we are writing
    const tengUri = "http://cci.org.au/datasets/BOWEL";

    const selectTuples = e.set(
      makeSystemlessIdentifier("HG00096"),
      makeSystemlessIdentifier("HG00171"),
      makeSystemlessIdentifier("HG00173"),
      makeSystemlessIdentifier("HG03433")
    );

    const testReleaseInsert = await e
      .insert(e.release.Release, {
        created: e.datetime(new Date()),
        applicationDacIdentifier: "XYZ",
        applicationDacTitle: "A Study in Many Parts",
        applicationDacDetails:
          "So this is all that we have brought over not coded",
        applicationCoded: e.json({
          version: 1,
          countriesInvolved: [
            {
              system: "urn:iso:std:iso:3166",
              code: "AU",
            },
          ],
          researchType: {
            code: "HMB",
          },
          institutesInvolved: [],
        }),
        datasetUris: e.array([tengUri]),
        selectedSpecimens: e.select(e.dataset.DatasetSpecimen, (dss) => ({
          filter: e.op(
            e.op(dss.dataset.uri, "=", tengUri),
            "and",
            e.op(selectTuples, "in", e.array_unpack(dss.externalIdentifiers))
          ),
        })),
      })
      .run(edgeDbClient);

    testReleaseId = testReleaseInsert.id;

    const allowedPiSubject = "http://subject1.com";

    const allowedPiUserInsert = await e
      .insert(e.permission.User, {
        subjectId: allowedPiSubject,
        displayName: "Test User Who Is Allowed PI Access",
        releaseParticipant: e.select(e.release.Release, (r) => ({
          filter: e.op(e.uuid(testReleaseId), "=", r.id),
          "@role": e.str("PI"),
        })),
      })
      .run(edgeDbClient);

    allowedUser = new AuthenticatedUser({
      id: allowedPiUserInsert.id,
      subjectId: allowedPiSubject,
    });

    const notAllowedSubject = "http://subject2.com";

    const notAllowedUserInsert = await e
      .insert(e.permission.User, {
        subjectId: notAllowedSubject,
        displayName: "Test User Who Isn't Allowed Any Access",
      })
      .run(edgeDbClient);

    notAllowedUser = new AuthenticatedUser({
      id: notAllowedUserInsert.id,
      subjectId: notAllowedSubject,
    });
  });

  it("allowed users can get release data", async () => {
    const result = await releasesService.get(allowedUser, testReleaseId);
  });

  it("not allowed users cannot get release data", async () => {
    await expect(async () => {
      const result = await releasesService.get(notAllowedUser, testReleaseId);
    }).rejects.toThrow(Error);
  });

  it("get cases level information from a release", async () => {
    const result = await releasesService.getCases(
      allowedUser,
      testReleaseId,
      5,
      0
    );

    console.log(JSON.stringify(result, null, 2));
  });
});
