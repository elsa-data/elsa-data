// must be first and before any DI is used
import "reflect-metadata";

import { bootstrapDependencyInjection } from "./bootstrap-dependency-injection";
import { bootstrapGlobalSynchronous } from "./bootstrap-global-synchronous";
import { getCommands } from "./entrypoint-command-helper";
import {
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
  commandInsertConfigDatasets,
  INSERT_CONFIG_DATASETS_COMMAND,
} from "./entrypoint-command-insert-datasets";
import {
  commandDeleteDataset,
  DELETE_DATASETS_COMMAND,
} from "./entrypoint-command-delete-datasets";

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
  console.log(
    `${INSERT_CONFIG_DATASETS_COMMAND} - Insert non existant dataset that appear in config.`
  );
  // TODO implement some guards on destructive operations
  // console.log(`${DELETE_DATASETS_COMMAND} <datasetUri> - delete specified dataset URI.`);
}

/**
 * Elsa Data entrypoint - process command line arguments performing operations - the main one which is
 * to start an Elsa Data web server (but can also do db migrations etc)
 */
(async () => {
  const commands = getCommands(process.argv);
  const todo = [];

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
        todo.push(async () => startWebServer(null));
        break;
      case WEB_SERVER_WITH_SCENARIO_COMMAND:
        if (c.args.length != 1)
          console.error(
            `Command ${WEB_SERVER_WITH_SCENARIO_COMMAND} requires a single number argument indicating which scenario to start with`
          );

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
      case INSERT_CONFIG_DATASETS_COMMAND:
        todo.push(async () => commandInsertConfigDatasets());
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

  // if no commands were specified - then our default behaviour is to invoke the web server and wait
  if (todo.length === 0) await startWebServer(null);
  else {
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
