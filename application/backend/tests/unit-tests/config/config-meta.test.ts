import { getMetaConfig } from "../../../src/config/config-load";
import { CONFIG_FOLDERS_ENVIRONMENT_VAR } from "../../../src/config/config-schema";

// TODO: because this actually instantiates the providers, all providers mentioned here need to work in test
// TODO: we still need to set up the test infrastructure so that AWS tests will work (using fake AWS??)

it("basic parsing of meta syntax", async () => {
  process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] =
    "./tests/unit-tests/config/real-like";

  const config = await getMetaConfig("file('base') file('dev-localhost')");

  expect(config).toHaveProperty("port", 8000);
  expect(config).toHaveProperty("ontoFhirUrl", "https://server.com/fhir");
});

it("basic parsing with right most providers overriding", async () => {
  process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] =
    "./tests/unit-tests/config/real-like";

  const config = await getMetaConfig(
    "file('base') file('dev-common') file('dev-localhost') file('datasets')"
  );

  // here the dev-common overrides the port as set in base
  expect(config).toHaveProperty("port", 8001);
});

it("plus minus operations for arrays", async () => {
  process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] =
    "./tests/unit-tests/config/real-like";

  // with just the single file we have two datasets
  {
    const config = await getMetaConfig("file('datasets')");

    expect(config).toHaveProperty("datasets");

    const datasets = config["datasets"];

    expect(datasets).toHaveLength(2);

    const datasetUris = datasets.map((ds: any) => ds.uri).sort();

    expect(datasetUris).toStrictEqual([
      "urn:elsa.net:2022:dataset001",
      "urn:elsa.net:2022:dataset002",
    ]);
  }

  // with the add-delete config added - we add two and remove 1
  {
    const config = await getMetaConfig("file('datasets') file('add-delete')");

    expect(config).toHaveProperty("datasets");

    const datasets = config["datasets"];

    expect(datasets).toHaveLength(3);

    const datasetUris = datasets.map((ds: any) => ds.uri).sort();

    expect(datasetUris).toStrictEqual([
      "urn:elsa.net:2022:dataset002",
      "urn:elsa.net:2022:datasetadd1",
      "urn:elsa.net:2022:datasetadd2",
    ]);
  }
});

it("minus an entry that doesn't exist is an error", async () => {
  process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] =
    "./tests/unit-tests/config/real-like";

  expect.assertions(1);
  try {
    await getMetaConfig("file('datasets') file('delete-doesnt-exist')");
  } catch (e: any) {
    expect(e.toString()).toContain("did not do anything");
  }
});

it("complex key with path expression works", async () => {
  process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] =
    "./tests/unit-tests/config/complex-keys";

  const config = await getMetaConfig(
    "file('test0') file('test1') file('test2')"
  );

  expect(config).toHaveProperty("aws");

  const aws = config["aws"];

  expect(aws).toHaveProperty("tempBucket", "replaced temp bucket");
});

it("basic parsing but with env variable override", async () => {
  process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] =
    "./tests/unit-tests/config/real-like";
  process.env["ELSA_DATA_CONFIG_PORT"] = "9999";

  const config = await getMetaConfig(
    "file('base') file('dev-common') file('dev-localhost') file('datasets')"
  );

  // here the explicit env variables overrides any file content
  expect(config).toHaveProperty("port", 9999);
});

it("parser error with double left bracket", async () => {
  await expect(async () => {
    await getMetaConfig(
      "file(('base') file('dev-common') file('dev-deployed')"
    );
  }).rejects.toThrow("an argument list is started");
});
