// must be first and before any DI is used
import "reflect-metadata";

import { App } from "./app";
import { bootstrapSettings } from "./bootstrap-settings";
import { insertTestData } from "./test-data/insert-test-data";
import { blankTestData } from "./test-data/blank-test-data";
import Bree from "bree";
import { container } from "tsyringe";
import { bootstrapDependencyInjection } from "./bootstrap-dependency-injection";
import path from "path";
import { ElsaSettings } from "./config/elsa-settings";
import { oneOffCommonInitialiseSynchronous } from "./bootstrap-common-once";
import { getMetaConfig } from "./config/config-schema";
import { CONFIG_SOURCES_ENVIRONMENT_VAR } from "./config/config-constants";
import {
  ADD_SCENARIO_COMMAND,
  DB_BLANK_COMMAND,
  DB_MIGRATE_COMMAND,
  ECHO_COMMAND,
  getCommands,
  WEB_SERVER_COMMAND,
  WEB_SERVER_WITH_SCENARIO_COMMAND,
} from "./entrypoint-command";
import { sleep } from "edgedb/dist/utils";

oneOffCommonInitialiseSynchronous();

// global settings for DI
bootstrapDependencyInjection();

// TODO - decide on a proper 'default' behaviour for config sources and replace this
async function getFromEnv(): Promise<ElsaSettings> {
  const metaSources = process.env[CONFIG_SOURCES_ENVIRONMENT_VAR];

  if (!metaSources)
    throw new Error(
      `For local development launch there must be a env variable ${CONFIG_SOURCES_ENVIRONMENT_VAR} set to the source of configurations`
    );

  return await bootstrapSettings(await getMetaConfig(metaSources));
}

const commandDbBlank = async (): Promise<number> => {
  const settings = await getFromEnv();

  await blankTestData();

  // return a command status code of 0 to indicate success
  return 0;
};

const commandDbMigrate = async (): Promise<number> => {
  const settings = await getFromEnv();

  throw Error("not implemented");
};

const commandAddScenario = async (scenario: number) => {
  const settings = await getFromEnv();

  await insertTestData(settings);
};

const startWebServer = async (scenario: number | null) => {
  const settings = await getFromEnv();

  container.register<ElsaSettings>("Settings", {
    useValue: settings,
  });

  if (scenario) {
    await blankTestData();
    // TODO allow different scenarios to be inserted based on the value
    await insertTestData(settings);
  }

  console.log("Starting job queue");

  const bree = new Bree({
    root: path.resolve("jobs"),
    jobs: [
      {
        name: "select-job.ts",
        timeout: "5s",
        interval: "20s",
      },
    ],
  });

  await bree.start();

  const app = new App(settings);

  const server = await app.setupServer();

  console.log(`Listening on port ${settings.port}`);

  try {
    await server.listen({ port: settings.port });

    // TODO detect close() event from the server
    while (true) {
      await sleep(5000);
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

(async () => {
  const commands = getCommands(process.argv);
  const todo = [];

  for (const c of commands) {
    switch (c.command) {
      case "help":
        console.log(
          `${WEB_SERVER_COMMAND} - launch Elsa Data web server and wait`
        );
        console.log(
          `${WEB_SERVER_WITH_SCENARIO_COMMAND} <scenario 1|2...> - launch Elsa Data web server and always blank/insert the given scenario on start up`
        );
        console.log(`${ECHO_COMMAND} <args> - echo arguments to console`);
        console.log(`${DB_BLANK_COMMAND}`);
        // TODO implement some guards on destructive operations
        //      console.log(`${DB_BLANK_COMMAND} [hostname] - delete all data from the database, requires hostname to be specified if in production`);
        console.log(`${DB_MIGRATE_COMMAND} - migrate database schema`);
        console.log(
          `${ADD_SCENARIO_COMMAND} <scenario 1|2...> - add in the data for a scenario`
        );
        process.exit(0);
        break;
      case WEB_SERVER_COMMAND:
        todo.push(async () => startWebServer(null));
        break;
      case WEB_SERVER_WITH_SCENARIO_COMMAND:
        if (c.args.length != 1)
          console.error(
            `Command ${WEB_SERVER_WITH_SCENARIO_COMMAND} requires a single number argument indicating which scenario to add`
          );

        todo.push(async () => startWebServer(parseInt(c.args[0])));
        break;
      case ECHO_COMMAND:
        todo.push(async () => console.log(c.args));
        break;
      case ADD_SCENARIO_COMMAND:
        if (c.args.length != 1)
          console.error(
            `Command ${ADD_SCENARIO_COMMAND} requires a single number argument indicating which scenario to add`
          );

        todo.push(async () => commandAddScenario(parseInt(c.args[0])));
        break;
      case DB_BLANK_COMMAND:
        todo.push(async () => commandDbBlank());
        break;
      case DB_MIGRATE_COMMAND:
        todo.push(async () => commandDbMigrate());
        break;
      default:
        console.error(`Unrecognised command ${c.command}`);
        process.exit(1);
    }
  }

  // if no commands were specified - then our default behaviour is to invoke the web server and wait
  if (todo.length === 0) await startWebServer(null);
  else {
    for (const t of todo) await t();
  }

  // we will only fall through to here and exit if there were actual commands specified and
  // we executed them i.e. for tasks where we want to do a database migrate then exit

  // TODO think about how we can report back the success or otherwise of the set of commands we ran
  process.exit(0);
})();
