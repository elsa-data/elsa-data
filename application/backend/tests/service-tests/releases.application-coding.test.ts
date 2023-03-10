import { Client, createClient } from "edgedb";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { findDatabaseRelease } from "./utils";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { ReleaseService } from "../../src/business/services/release-service";

let edgeDbClient: Client;
let releaseService: ReleaseService;
let testReleaseKey: string;

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

beforeAll(async () => {
  const testContainer = await registerTypes();

  edgeDbClient = testContainer.resolve("Database");
  releaseService = testContainer.resolve(ReleaseService);
});

beforeEach(async () => {
  ({ testReleaseKey, allowedDataOwnerUser, allowedPiUser, notAllowedUser } =
    await beforeEachCommon());
});
it("basic add/remove of diseases from coded application", async () => {
  {
    const r = await findDatabaseRelease(edgeDbClient, testReleaseKey);
    expect(r.applicationCoded.diseasesOfStudy.length).toBe(1);
    expect(r.applicationCoded.diseasesOfStudy).toContainEqual({
      system: "mondo",
      code: "ABCD",
    });
  }
  {
    await releaseService.addDiseaseToApplicationCoded(
      allowedPiUser,
      testReleaseKey,
      "AA",
      "BB"
    );

    const r = await findDatabaseRelease(edgeDbClient, testReleaseKey);

    expect(r.applicationCoded.diseasesOfStudy.length).toBe(2);
    expect(r.applicationCoded.diseasesOfStudy).toContainEqual({
      system: "AA",
      code: "BB",
    });
    expect(r.applicationCoded.diseasesOfStudy).toContainEqual({
      system: "mondo",
      code: "ABCD",
    });
  }

  {
    await releaseService.addDiseaseToApplicationCoded(
      allowedPiUser,
      testReleaseKey,
      "AA",
      "CC"
    );

    await releaseService.removeDiseaseFromApplicationCoded(
      allowedPiUser,
      testReleaseKey,
      "mondo",
      "ABCD"
    );

    const r = await findDatabaseRelease(edgeDbClient, testReleaseKey);

    expect(r.applicationCoded.diseasesOfStudy.length).toBe(2);
    expect(r.applicationCoded.diseasesOfStudy).toContainEqual({
      system: "AA",
      code: "BB",
    });
    expect(r.applicationCoded.diseasesOfStudy).toContainEqual({
      system: "AA",
      code: "CC",
    });
  }
});

it("basic add/remove of countries from coded application", async () => {
  {
    const r = await findDatabaseRelease(edgeDbClient, testReleaseKey);
    expect(r.applicationCoded.countriesInvolved.length).toBe(1);
    expect(r.applicationCoded.countriesInvolved).toContainEqual({
      system: "iso",
      code: "AU",
    });
  }
  {
    await releaseService.addCountryToApplicationCoded(
      allowedPiUser,
      testReleaseKey,
      "AA",
      "BB"
    );

    const r = await findDatabaseRelease(edgeDbClient, testReleaseKey);

    expect(r.applicationCoded.countriesInvolved.length).toBe(2);
    expect(r.applicationCoded.countriesInvolved).toContainEqual({
      system: "AA",
      code: "BB",
    });
    expect(r.applicationCoded.countriesInvolved).toContainEqual({
      system: "iso",
      code: "AU",
    });
  }

  {
    await releaseService.addCountryToApplicationCoded(
      allowedPiUser,
      testReleaseKey,
      "AA",
      "CC"
    );

    await releaseService.removeCountryFromApplicationCoded(
      allowedPiUser,
      testReleaseKey,
      "iso",
      "AU"
    );

    const r = await findDatabaseRelease(edgeDbClient, testReleaseKey);

    expect(r.applicationCoded.countriesInvolved.length).toBe(2);
    expect(r.applicationCoded.countriesInvolved).toContainEqual({
      system: "AA",
      code: "BB",
    });
    expect(r.applicationCoded.countriesInvolved).toContainEqual({
      system: "AA",
      code: "CC",
    });
  }
});

it("set like behaviour of disease/country in coded application", async () => {
  {
    await releaseService.addCountryToApplicationCoded(
      allowedPiUser,
      testReleaseKey,
      "iso",
      "AU"
    );

    const r = await findDatabaseRelease(edgeDbClient, testReleaseKey);

    expect(r.applicationCoded.countriesInvolved.length).toBe(1);
    expect(r.applicationCoded.countriesInvolved).toContainEqual({
      system: "iso",
      code: "AU",
    });
  }

  {
    await releaseService.addDiseaseToApplicationCoded(
      allowedPiUser,
      testReleaseKey,
      "mondo",
      "ABCD"
    );

    const r = await findDatabaseRelease(edgeDbClient, testReleaseKey);

    expect(r.applicationCoded.diseasesOfStudy.length).toBe(1);
    expect(r.applicationCoded.diseasesOfStudy).toContainEqual({
      system: "mondo",
      code: "ABCD",
    });
  }

  // confirm that adding something where only the system changes - does still push something
  {
    await releaseService.addDiseaseToApplicationCoded(
      allowedPiUser,
      testReleaseKey,
      "mondoNOT",
      "ABCD"
    );

    const r = await findDatabaseRelease(edgeDbClient, testReleaseKey);

    expect(r.applicationCoded.diseasesOfStudy.length).toBe(2);

    expect(r.applicationCoded.diseasesOfStudy).toContainEqual({
      system: "mondoNOT",
      code: "ABCD",
    });
  }
});
