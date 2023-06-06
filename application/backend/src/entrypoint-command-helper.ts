import { ElsaSettings } from "./config/elsa-settings";
import { CONFIG_SOURCES_ENVIRONMENT_VAR } from "./config/config-schema";
import { bootstrapSettings } from "./bootstrap-settings";
import { getMetaConfig } from "./config/config-load";

export type EntrypointCommandHelper = {
  command: string;
  args: string[];
};

/**
 * A poor substitute for something like yargs - but one that supports specifying
 * multiple commands on a single argv separated by ";"
 * @param argv
 */
export function getCommands(argv: string[]): EntrypointCommandHelper[] {
  // we are looking to build a set of commands that this invoke of the entrypoint should
  // execute in order
  const commandStrings = [];

  if (process.argv && process.argv.length > 2) {
    const allArgv = process.argv.slice(2).join(" ");

    // semicolons are a designated command splitters that we want to retain in the token list
    const semiSplit = allArgv.split(";");

    commandStrings.push(...semiSplit);
  }

  const commands: EntrypointCommandHelper[] = [];

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
  config: any;
  redactedConfig: any;
}> {
  const metaSources = process.env[CONFIG_SOURCES_ENVIRONMENT_VAR];

  if (!metaSources)
    throw new Error(
      `There must be a env variable ${CONFIG_SOURCES_ENVIRONMENT_VAR} set to the source of configurations`
    );

  const config = await getMetaConfig(metaSources);

  return {
    sources: metaSources,
    settings: await bootstrapSettings(config),
    config: config,
    // waiting for this and then we can just return the redacted JSON direct
    // https://github.com/mozilla/node-convict/pull/407
    // we are returning the redacted config just basically so we can do a log dump of its content
    // which we can't do here because we have a chicken/egg problem of constructing the logger first

    // TBD now we have removed convict - this redaction does not automatically happen
    // need to write a serializer that takes into account the Sensitive zod
    redactedConfig: JSON.parse(JSON.stringify(config)),
  };
}
