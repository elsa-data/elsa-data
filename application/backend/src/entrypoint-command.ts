export const WEB_SERVER_COMMAND = "web-server";
export const WEB_SERVER_WITH_SCENARIO_COMMAND = "web-server-with-scenario";
export const DB_MIGRATE_COMMAND = "db-migrate";
export const ECHO_COMMAND = "echo";
export const DB_BLANK_COMMAND = "db-blank";
export const ADD_SCENARIO_COMMAND = "add-scenario";

export type EntrypointCommand = {
  command: string;
  args: string[];
};

export function getCommands(argv: string[]): EntrypointCommand[] {
  // we are looking to build a set of commands that this invoke of the entrypoint should
  // execute in order
  const commandStrings = [];

  if (process.argv && process.argv.length > 2) {
    const allArgv = process.argv.slice(2).join(" ");

    // semicolons are a designated command splitters that we want to retain in the token list
    const semiSplit = allArgv.split(";");

    commandStrings.push(...semiSplit);
  }

  const commands: EntrypointCommand[] = [];

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
