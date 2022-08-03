import { Client, createClient } from "edgedb";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { findDatabaseRelease } from "./utils";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "./setup";
import { ReleaseService } from "../../src/business/services/release-service";

const testContainer = registerTypes();

const releasesService = testContainer.resolve(ReleaseService);
const edgeDbClient = testContainer.resolve<Client>("Database");

let testReleaseId: string;

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

beforeEach(async () => {
  testContainer.clearInstances();

  ({ testReleaseId, allowedDataOwnerUser, allowedPiUser, notAllowedUser } =
    await beforeEachCommon());
});

it("basic add/remove of diseases from coded application", async () => {
  {
    const r = await findDatabaseRelease(edgeDbClient, testReleaseId);
    expect(r.applicationCoded.diseasesOfStudy.length).toBe(1);
    expect(r.applicationCoded.diseasesOfStudy).toContainEqual({
      system: "mondo",
      code: "ABCD",
    });
  }
  {
    await releasesService.addDiseaseToApplicationCoded(
      allowedPiUser,
      testReleaseId,
      "AA",
      "BB"
    );

    const r = await findDatabaseRelease(edgeDbClient, testReleaseId);

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
    await releasesService.addDiseaseToApplicationCoded(
      allowedPiUser,
      testReleaseId,
      "AA",
      "CC"
    );

    await releasesService.removeDiseaseFromApplicationCoded(
      allowedPiUser,
      testReleaseId,
      "mondo",
      "ABCD"
    );

    const r = await findDatabaseRelease(edgeDbClient, testReleaseId);

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
    const r = await findDatabaseRelease(edgeDbClient, testReleaseId);
    expect(r.applicationCoded.countriesInvolved.length).toBe(1);
    expect(r.applicationCoded.countriesInvolved).toContainEqual({
      system: "iso",
      code: "AU",
    });
  }
  {
    await releasesService.addCountryToApplicationCoded(
      allowedPiUser,
      testReleaseId,
      "AA",
      "BB"
    );

    const r = await findDatabaseRelease(edgeDbClient, testReleaseId);

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
    await releasesService.addCountryToApplicationCoded(
      allowedPiUser,
      testReleaseId,
      "AA",
      "CC"
    );

    await releasesService.removeCountryFromApplicationCoded(
      allowedPiUser,
      testReleaseId,
      "iso",
      "AU"
    );

    const r = await findDatabaseRelease(edgeDbClient, testReleaseId);

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
    await releasesService.addCountryToApplicationCoded(
      allowedPiUser,
      testReleaseId,
      "iso",
      "AU"
    );

    const r = await findDatabaseRelease(edgeDbClient, testReleaseId);

    expect(r.applicationCoded.countriesInvolved.length).toBe(1);
    expect(r.applicationCoded.countriesInvolved).toContainEqual({
      system: "iso",
      code: "AU",
    });
  }

  {
    await releasesService.addDiseaseToApplicationCoded(
      allowedPiUser,
      testReleaseId,
      "mondo",
      "ABCD"
    );

    const r = await findDatabaseRelease(edgeDbClient, testReleaseId);

    expect(r.applicationCoded.diseasesOfStudy.length).toBe(1);
    expect(r.applicationCoded.diseasesOfStudy).toContainEqual({
      system: "mondo",
      code: "ABCD",
    });
  }

  // confirm that adding something where only the system changes - does still push something
  {
    await releasesService.addDiseaseToApplicationCoded(
      allowedPiUser,
      testReleaseId,
      "mondoNOT",
      "ABCD"
    );

    const r = await findDatabaseRelease(edgeDbClient, testReleaseId);

    expect(r.applicationCoded.diseasesOfStudy.length).toBe(2);

    expect(r.applicationCoded.diseasesOfStudy).toContainEqual({
      system: "mondoNOT",
      code: "ABCD",
    });
  }
});
