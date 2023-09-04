import { ElsaSettings } from "./config/elsa-settings";
import {
  CONFIG_SOURCES_ENVIRONMENT_VAR,
  ElsaConfigurationType,
} from "./config/config-schema";
import { bootstrapSettings } from "./bootstrap-settings";
import { getMetaConfig } from "./config/config-load";
import { AuthenticatedUser } from "./business/authenticated-user";
import { Client } from "edgedb";
import e from "../dbschema/edgeql-js";
import { promisify } from "util";
import { execFile } from "child_process";

export type EntrypointHelper = {
  command: string;
  args: string[];
};

/**
 * A poor substitute for something like yargs - but one that supports specifying
 * multiple commands on a single argv separated by ";"
 * @param argv
 */
export function getCommands(argv: string[]): EntrypointHelper[] {
  // we are looking to build a set of commands that this invoke of the entrypoint should
  // execute in order
  const commandStrings = [];

  if (process.argv && process.argv.length > 2) {
    const allArgv = process.argv.slice(2).join(" ");

    // semicolons are a designated command splitters that we want to retain in the token list
    const semiSplit = allArgv.split(";");

    commandStrings.push(...semiSplit);
  }

  const commands: EntrypointHelper[] = [];

  for (const c of commandStrings) {
    // if the args have extra semicolons etc - which result in empty commands - we don't mind - just skip
    if (c.trim().length === 0) continue;

    const commandSplit = c.trim().split(" ");

    if (commandSplit.length === 1) {
      commands.push({
        command: commandSplit[0],
        args: [],
      });
    } else {
      commands.push({
        command: commandSplit[0],
        args: commandSplit.slice(1),
      });
    }
  }

  return commands;
}

// TODO - decide on a proper 'default' behaviour for config sources and replace this
export async function getFromEnv(): Promise<{
  sources: string;
  settings: ElsaSettings;
  rawConfig: ElsaConfigurationType;
  redactedConfig: ElsaConfigurationType;
}> {
  const sources = process.env[CONFIG_SOURCES_ENVIRONMENT_VAR];

  if (!sources)
    throw new Error(
      `There must be a env variable ${CONFIG_SOURCES_ENVIRONMENT_VAR} set to the source of configurations`
    );

  // the raw configuration from our sources - this can *only* be objects that are
  // expressible in JSON (numbers, strings etc)
  const config = await getMetaConfig(sources);

  // convert the config into a richer settings object
  // this can contain one off constructed objects like OidcClient etc
  const settings = await bootstrapSettings(config);

  return {
    sources: sources,
    settings: settings,
    rawConfig: config,
    // TBD now we have removed convict - this redaction does not automatically happen
    // need to write a serializer that takes into account the Sensitive zod
    // we are returning the redacted config just basically so we can do a log dump of its content
    // which we can't do here because we have a chicken/egg problem of constructing the logger first
    redactedConfig: JSON.parse(JSON.stringify(config)),
  };
}

export async function executeEdgeCli(args: string[]) {
  const execFilePromise = promisify(execFile);

  console.log(`Executing EdgeDb CLI`);

  const promiseInvoke = execFilePromise("/a/edgedb", args, {
    maxBuffer: 1024 * 1024 * 64,
  });

  const { stdout, stderr } = await promiseInvoke;

  console.log(`Error code = ${promiseInvoke.child.exitCode}`);

  if (stdout) {
    stdout.split("\n").forEach((l) => console.log(`stdout ${l}`));
  }
  if (stderr) {
    stderr.split("\n").forEach((l) => console.log(`stderr ${l}`));
  }
}
