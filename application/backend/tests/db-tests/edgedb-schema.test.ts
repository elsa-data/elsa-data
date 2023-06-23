import { Client, createClient } from "edgedb";
import e from "../../dbschema/edgeql-js";
import { blankTestData } from "../../src/test-data/util/blank-test-data";
import { makeSystemlessIdentifierArray } from "../../src/test-data/util/test-data-helpers";

describe("edgedb tests", () => {
  let edgeDbClient: Client;

  beforeAll(async () => {
    edgeDbClient = createClient({});
  });

  afterAll(() => {});

  beforeEach(async () => {
    await blankTestData();
  });

  it("Check cascading dataset", async () => {
    const insertArtifact = e.insert(e.lab.ArtifactBcl, {
      bclFile: e.insert(e.storage.File, {
        url: "s3://test-file.bcl",
        size: 101,
        checksums: [
          {
            type: "MD5",
            value: "RANDOM_CHECKSUM",
          },
        ],
      }),
    });

    const insertSpecimen = e.insert(e.dataset.DatasetSpecimen, {
      externalIdentifiers: makeSystemlessIdentifierArray("specimen-id-test"),
      artifacts: e.set(insertArtifact),
    });

    const insertPatient = e.insert(e.dataset.DatasetPatient, {
      externalIdentifiers: makeSystemlessIdentifierArray("patient-id-test"),
      consent: e.insert(e.consent.Consent, {}),
      specimens: e.set(insertSpecimen),
    });

    const insertDataset = e.insert(e.dataset.Dataset, {
      uri: "test-dataset-uri",
      externalIdentifiers: makeSystemlessIdentifierArray(""),
      description: "A uri test",
      cases: e.set(
        e.insert(e.dataset.DatasetCase, {
          externalIdentifiers: makeSystemlessIdentifierArray("case-id-test"),
          patients: e.set(insertPatient),
        })
      ),
    });

    await insertDataset.run(edgeDbClient);

    const selectDataset = async () =>
      await e.select(e.dataset.Dataset, () => ({})).run(edgeDbClient);
    const selectPatient = async () =>
      await e.select(e.dataset.DatasetPatient, () => ({})).run(edgeDbClient);
    const selectSpecimen = async () =>
      await e.select(e.dataset.DatasetSpecimen, () => ({})).run(edgeDbClient);
    const selectConsent = async () =>
      await e.select(e.consent.Consent, () => ({})).run(edgeDbClient);
    const selectFile = async () =>
      await e.select(e.storage.File, () => ({})).run(edgeDbClient);
    const selectArtifactBase = async () =>
      await e.select(e.lab.ArtifactBase, () => ({})).run(edgeDbClient);

    // Making sure it exist
    expect((await selectDataset()).length).toEqual(1);
    expect((await selectPatient()).length).toEqual(1);
    expect((await selectSpecimen()).length).toEqual(1);
    expect((await selectConsent()).length).toEqual(1);
    expect((await selectFile()).length).toEqual(1);
    expect((await selectArtifactBase()).length).toEqual(1);

    // Delete dataset to ensure all hierarchy deleted
    await e.delete(e.dataset.Dataset).run(edgeDbClient);

    // Expect all children is deleted as part of dataset deletion
    expect((await selectDataset()).length).toEqual(0);
    expect((await selectPatient()).length).toEqual(0);
    expect((await selectSpecimen()).length).toEqual(0);
    expect((await selectConsent()).length).toEqual(0);

    // Expecting lab::ArtifactBase -> storage::File is not deleted as it is not owned by a dataset.
    expect((await selectFile()).length).toEqual(1);
    expect((await selectArtifactBase()).length).toEqual(1);
  });

  it("Check cascading artifactBase", async () => {
    const insertArtifact = e.insert(e.lab.ArtifactBcl, {
      bclFile: e.insert(e.storage.File, {
        url: "s3://test-file.bcl",
        size: 101,
        checksums: [
          {
            type: "MD5",
            value: "RANDOM_CHECKSUM",
          },
        ],
      }),
    });

    await insertArtifact.run(edgeDbClient);

    const selectFile = async () =>
      await e.select(e.storage.File, () => ({})).run(edgeDbClient);
    const selectArtifactBase = async () =>
      await e.select(e.lab.ArtifactBase, () => ({})).run(edgeDbClient);

    // Making sure it exist
    expect((await selectFile()).length).toEqual(1);
    expect((await selectArtifactBase()).length).toEqual(1);

    // Delete dataset to ensure all hierarchy deleted
    await e.delete(e.lab.ArtifactBase).run(edgeDbClient);

    // Expecting lab::ArtifactBase -> storage::File IS deleted.
    expect((await selectFile()).length).toEqual(0);
    expect((await selectArtifactBase()).length).toEqual(0);
  });
});
