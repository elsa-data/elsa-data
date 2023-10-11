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
import { Logger } from "pino";
import { isEmpty } from "lodash";
import { ZodIssue, ZodIssueCode } from "zod";
import { parseMeta } from "./config/meta/meta-parser";

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

/**
 * An initial load of the configuration settings using the mandatory
 * meta sources (specified via environment variable). In general tries
 * to safely return issues (and whatever config it can make) - so that
 * we can properly log the issues higher in the stack.
 */
export async function getFromEnv(): Promise<{
  sources?: string;
  rawConfig?: ElsaConfigurationType;
  redactedConfig?: ElsaConfigurationType;
  configIssues?: ZodIssue[];
  settings?: ElsaSettings;
}> {
  const sources = process.env[CONFIG_SOURCES_ENVIRONMENT_VAR];

  if (!sources)
    return {
      configIssues: [
        {
          code: ZodIssueCode.custom,
          path: [],
          message: `No sources defined in the environment variable '${CONFIG_SOURCES_ENVIRONMENT_VAR}'`,
        },
      ],
    };

  // the meta syntax tells us where to source configuration from and in what order
  const metaProviders = parseMeta(sources);

  // the raw configuration from our sources - this can *only* be objects that are
  // expressible in JSON (numbers, strings etc)
  const { config, configIssues } = await getMetaConfig(metaProviders);

  // if there is no config then Zod couldn't make it a valid configuration - even without
  // strict mode
  if (!config) {
    return {
      sources: sources,
      configIssues: configIssues,
    };
  }

  // create a redacted version as well
  const configCopy = JSON.parse(JSON.stringify(config));
  redactConfig(configCopy);

  // convert the config into a richer settings object
  // this can contain one off constructed objects like OidcClient etc
  const settings = await bootstrapSettings(config);

  return {
    sources: sources,
    rawConfig: config,
    redactedConfig: configCopy,
    configIssues: configIssues,
    settings: settings,
  };
}

/**
 * Recursively replaces the string value of any keys that have names
 * that are suspiciously like something we shouldn't print out.
 *
 * @param obj
 */
export function redactConfig(obj: any) {
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      if (Array.isArray(obj[key])) {
        // loop through array
        for (let i = 0; i < obj[key].length; i++) {
          redactConfig(obj[key][i]);
        }
      } else {
        // call function recursively for object
        redactConfig(obj[key]);
      }
    } else {
      const lowerKey = key.toLowerCase();

      // this is a pretty weak way of doing - a blacklist like this can always let things through
      // but is better than nothing
      // (in general the config is not displayed anywhere anyhow)
      if (
        lowerKey.includes("secret") ||
        lowerKey.includes("salt") ||
        lowerKey.includes("botkey")
      )
        obj[key] = "****";
    }
  }
}

/**
 * Run the `edgedb` CLI command with the given arguments. Deletes a set of
 * keys from the environment if need be (this can be needed in order to
 * convince EdgeDb that it is *not* already configured for a particular db).
 *
 * @param logger
 * @param args
 * @param deleteEnvKeys
 */
export async function executeEdgeCli(
  logger: Logger,
  args: string[],
  deleteEnvKeys: string[] = []
) {
  const execFilePromise = promisify(execFile);

  logger.debug(`EdgeDb CLI invoke args = ${args.join(", ")}`);

  const newEnv = { ...process.env };

  for (const ek of deleteEnvKeys ?? []) {
    delete newEnv[ek];
  }

  const promiseInvoke = execFilePromise("/a/edgedb", args, {
    maxBuffer: 1024 * 1024 * 64,
    env: newEnv,
  });

  const { stdout, stderr } = await promiseInvoke;

  logger.debug(`EdgeDb CLI exit code = ${promiseInvoke.child.exitCode}`);

  if (stdout) {
    stdout.split("\n").forEach((l) => {
      if (!isEmpty(l)) logger.info(l);
    });
  }
  if (stderr) {
    stderr.split("\n").forEach((l) => {
      if (!isEmpty(l)) logger.warn(l);
    });
  }
}
