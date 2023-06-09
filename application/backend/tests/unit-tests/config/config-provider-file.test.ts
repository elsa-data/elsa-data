import { ProviderFile } from "../../../src/config/providers/provider-file";
import { CONFIG_FOLDERS_ENVIRONMENT_VAR } from "../../../src/config/config-schema";
import { promises as fs } from "fs";
import * as path from "path";

const FOLDER1_RELATIVE = "./tests/unit-tests/config/folder1";
const FOLDER2_RELATIVE = "./tests/unit-tests/config/folder2";

it("basic config file loads from a single relative folder path", async () => {
  process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] = FOLDER1_RELATIVE;

  const pf = new ProviderFile([{ type: "string", value: "test1" }]);

  const config = await pf.getConfig();

  expect(config.stringValue).toEqual("a string");
  expect(config.superAdmins).toHaveLength(2);
});

it("basic config file loads from an absolute folder path", async () => {
  process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] = await fs.realpath(
    FOLDER1_RELATIVE
  );

  const pf = new ProviderFile([{ type: "string", value: "test1" }]);

  const config = await pf.getConfig();

  expect(config.stringValue).toEqual("a string");
  expect(config.superAdmins).toHaveLength(2);
});

it("basic config file loads from an sequence of folders, some absolute, some relative, some invalid", async () => {
  process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] = `./notrealpath${
    path.delimiter
  }${await fs.realpath(FOLDER1_RELATIVE)}${path.delimiter}${FOLDER2_RELATIVE}`;

  const pf = new ProviderFile([{ type: "string", value: "test1" }]);

  const config = await pf.getConfig();

  expect(config.stringValue).toEqual("a string");
  expect(config.superAdmins).toHaveLength(2);
});

it("non-existent config file throws Error from a single relative folder path", async () => {
  process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] = FOLDER1_RELATIVE;

  const pf = new ProviderFile([{ type: "string", value: "dontexist" }]);

  await expect(async () => {
    await pf.getConfig();
  }).rejects.toThrow("was not found in any of the configuration folders");
});

it("trying to use relative file paths won't find a config (same as non-existent)", async () => {
  {
    process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] = FOLDER2_RELATIVE;

    // we want to prove that it does exist
    const pf = new ProviderFile([{ type: "string", value: "only2" }]);

    const config = await pf.getConfig();

    expect(config.stringValue).toEqual("only in 2");
  }

  {
    process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] = FOLDER1_RELATIVE;

    // we try to walk outside our config folder
    const pf = new ProviderFile([
      { type: "string", value: "../folder2/only2" },
    ]);

    // and now it doesn't exist
    await expect(async () => {
      await pf.getConfig();
    }).rejects.toThrow("was not found in any of the configuration folders");
  }
});

it("change the ordering of two different folders to see the different files loaded (first/left most wins)", async () => {
  {
    process.env[
      CONFIG_FOLDERS_ENVIRONMENT_VAR
    ] = `${FOLDER1_RELATIVE}${path.delimiter}${FOLDER2_RELATIVE}`;

    const pf = new ProviderFile([{ type: "string", value: "test1" }]);
    const config = await pf.getConfig();

    expect(config.stringValue).toEqual("a string");
  }

  {
    process.env[
      CONFIG_FOLDERS_ENVIRONMENT_VAR
    ] = `${FOLDER2_RELATIVE}${path.delimiter}${FOLDER1_RELATIVE}`;

    const pf = new ProviderFile([{ type: "string", value: "test1" }]);
    const config = await pf.getConfig();

    expect(config.stringValue).toEqual("still a string");
  }
});

it("duplicate listing of a folder is an error", async () => {
  process.env[
    CONFIG_FOLDERS_ENVIRONMENT_VAR
  ] = `${FOLDER1_RELATIVE}${path.delimiter}${FOLDER2_RELATIVE}${path.delimiter}${FOLDER1_RELATIVE}`;

  const pf = new ProviderFile([{ type: "string", value: "test1" }]);

  await expect(async () => {
    await pf.getConfig();
  }).rejects.toThrow("folder we have already had listed");
});
