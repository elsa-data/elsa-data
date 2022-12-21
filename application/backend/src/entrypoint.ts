// must be first and before any DI is used
import "reflect-metadata";

import { bootstrapDependencyInjection } from "./bootstrap-dependency-injection";
import { bootstrapGlobalSynchronous } from "./bootstrap-global-synchronous";
import { getCommands, getFromEnv } from "./entrypoint-command-helper";
import {
  startJobQueue,
  startWebServer,
  WEB_SERVER_COMMAND,
  WEB_SERVER_WITH_SCENARIO_COMMAND,
} from "./entrypoint-command-start-web-server";
import {
  commandDbBlank,
  DB_BLANK_COMMAND,
} from "./entrypoint-command-db-blank";
import {
  commandDbMigrate,
  DB_MIGRATE_COMMAND,
} from "./entrypoint-command-db-migrate";
import {
  ADD_SCENARIO_COMMAND,
  commandAddScenario,
} from "./entrypoint-command-add-scenario";
import {
  commandDeleteDataset,
  DELETE_DATASETS_COMMAND,
} from "./entrypoint-command-delete-datasets";
import { container } from "tsyringe";
import { ElsaSettings } from "./config/elsa-settings";
import pino, { Logger } from "pino";

// some Node wide synchronous initialisations
bootstrapGlobalSynchronous();

// global settings for DI
bootstrapDependencyInjection();

/**
 * Help text for the commands that can be executed
 */
function printHelpText() {
  console.log(`${WEB_SERVER_COMMAND} - launch Elsa Data web server and wait`);
  console.log(
    `${WEB_SERVER_WITH_SCENARIO_COMMAND} <scenario 1|2...> - launch Elsa Data web server and always blank/insert the given scenario on start up`
  );
  console.log(`${DB_BLANK_COMMAND}`);
  // TODO implement some guards on destructive operations
  //      console.log(`${DB_BLANK_COMMAND} [hostname] - delete all data from the database, requires hostname to be specified if in production`);
  console.log(`${DB_MIGRATE_COMMAND} - migrate database schema`);
  console.log(
    `${ADD_SCENARIO_COMMAND} <scenario 1|2...> - add in the data for a scenario`
  );
  // TODO implement some guards on destructive operations
  // console.log(`${DELETE_DATASETS_COMMAND} <datasetUri> - delete specified dataset URI.`);
}

/**
 * Elsa Data entrypoint - process command line arguments performing operations - the main one which is
 * to start an Elsa Data web server (but can also do db migrations etc)
 */
(async () => {
  // now we are async - we can perform setup operations that themselves need to be async
  // settings and config are mainly of interest only to the web server - but it is possible some other
  // operations might need to use services so we get all the setup out of the way here
  const { settings, config, redactedConfig, sources } = await getFromEnv();

  const logger = pino(settings.logger);

  logger.info(
    redactedConfig,
    `Configuration (redacted) was sourced from "${sources}"`
  );

  // register all these for use in any service that supports DI
  container.register<ElsaSettings>("Settings", {
    useValue: settings,
  });

  container.register<Logger>("Logger", {
    useValue: logger,
  });

  const commands = getCommands(process.argv);
  const todo = [];

  logger.info(`Invocation commands are ${JSON.stringify(commands)}`);

  for (const c of commands) {
    switch (c.command) {
      case "help":
        printHelpText();
        process.exit(0);
        break;

      case "echo":
        // TODO consider if this is in anyway useful / too dangerous
        todo.push(async () => {
          console.log(c.args);
          return 0;
        });
        break;

      case WEB_SERVER_COMMAND:
        todo.push(async () => startJobQueue(config));
        todo.push(async () => startWebServer(null));
        break;

      case WEB_SERVER_WITH_SCENARIO_COMMAND:
        if (c.args.length != 1)
          console.error(
            `Command ${WEB_SERVER_WITH_SCENARIO_COMMAND} requires a single number argument indicating which scenario to start with`
          );

        todo.push(async () => startJobQueue(config));
        todo.push(async () => startWebServer(parseInt(c.args[0])));
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

      case DELETE_DATASETS_COMMAND:
        todo.push(async () => commandDeleteDataset(c.args));
        break;

      default:
        console.error(`Unrecognised command ${c.command}`);
        printHelpText();
        process.exit(1);
    }
  }

  // if no commands were specified - then our default behaviour is to pretend they asked us todo start-web-server
  if (todo.length === 0) {
    await startJobQueue(config);
    await startWebServer(null);
  } else {
    for (const t of todo) {
      const returnCode = await t();

      // TODO decide if we abort immediately on bad return codes
    }
  }

  // we will only fall through to here and exit if there were actual commands specified and
  // we executed them i.e. for tasks where we want to do a database migrate then exit

  // TODO think about how we can report back the success or otherwise of the set of commands we ran
  process.exit(0);
})();
