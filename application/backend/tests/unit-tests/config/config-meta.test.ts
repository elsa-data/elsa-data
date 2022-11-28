import { getMetaConfig } from "../../../src/config/config-schema";
import { CONFIG_FOLDERS_ENVIRONMENT_VAR } from "../../../src/config/config-constants";

// TODO: because this actually instantiates the providers, all providers mentioned here need to work in test
// TODO: we still need to set up the test infrastructure so that AWS tests will work (using fake AWS??)

it("basic parsing of meta syntax", async () => {
  process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] =
    "./tests/unit-tests/config/real-like";

  const config = await getMetaConfig("file('base') file('dev-localhost')");

  expect(config.getProperties()).toHaveProperty("port", 8000);
  expect(config.getProperties()).toHaveProperty(
    "ontoFhirUrl",
    "https://server.com/fhir"
  );
});

it("basic parsing with right most providers overriding", async () => {
  process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] =
    "./tests/unit-tests/config/real-like";

  const config = await getMetaConfig(
    "file('base') file('dev-common') file('dev-localhost') file('datasets')"
  );

  // here the dev-common overrides the port as set in base
  expect(config.getProperties()).toHaveProperty("port", 8001);
});

it("basic parsing but with env variable override", async () => {
  process.env["ELSA_DATA_CONFIG_PORT"] = "9999";

  const config = await getMetaConfig(
    "file('base') file('dev-common') file('dev-localhost') file('datasets')"
  );

  // here the explicit env variables overrides any file content
  expect(config.getProperties()).toHaveProperty("port", 9999);
});

it("parser error with double left bracket", async () => {
  await expect(async () => {
    await getMetaConfig(
      "file(('base') file('dev-common') file('dev-deployed')"
    );
  }).rejects.toThrow("an argument list is started");
});
