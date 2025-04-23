import { Client, createClient } from "gel";
import e from "../../dbschema/edgeql-js";
import { blankTestData } from "../../src/test-data/util/blank-test-data";
import { makeSystemlessIdentifierArray } from "../../src/test-data/util/test-data-helpers";

describe("gel tests", () => {
  let gelClient: Client;

  beforeAll(async () => {
    gelClient = createClient({});
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
        }),
      ),
    });

    await insertDataset.run(gelClient);

    const selectDataset = async () =>
      await e.select(e.dataset.Dataset, () => ({})).run(gelClient);
    const selectPatient = async () =>
      await e.select(e.dataset.DatasetPatient, () => ({})).run(gelClient);
    const selectSpecimen = async () =>
      await e.select(e.dataset.DatasetSpecimen, () => ({})).run(gelClient);
    const selectConsent = async () =>
      await e.select(e.consent.Consent, () => ({})).run(gelClient);
    const selectFile = async () =>
      await e.select(e.storage.File, () => ({})).run(gelClient);
    const selectArtifactBase = async () =>
      await e.select(e.lab.ArtifactBase, () => ({})).run(gelClient);

    // Making sure it exist
    expect((await selectDataset()).length).toEqual(1);
    expect((await selectPatient()).length).toEqual(1);
    expect((await selectSpecimen()).length).toEqual(1);
    expect((await selectConsent()).length).toEqual(1);
    expect((await selectFile()).length).toEqual(1);
    expect((await selectArtifactBase()).length).toEqual(1);

    // Delete dataset to ensure all hierarchy deleted
    await e.delete(e.dataset.Dataset).run(gelClient);

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

    await insertArtifact.run(gelClient);

    const selectFile = async () =>
      await e.select(e.storage.File, () => ({})).run(gelClient);
    const selectArtifactBase = async () =>
      await e.select(e.lab.ArtifactBase, () => ({})).run(gelClient);

    // Making sure it exist
    expect((await selectFile()).length).toEqual(1);
    expect((await selectArtifactBase()).length).toEqual(1);

    // Delete dataset to ensure all hierarchy deleted
    await e.delete(e.lab.ArtifactBase).run(gelClient);

    // Expecting lab::ArtifactBase -> storage::File IS deleted.
    expect((await selectFile()).length).toEqual(0);
    expect((await selectArtifactBase()).length).toEqual(0);
  });
});
