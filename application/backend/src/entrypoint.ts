// must be first and before any DI is used
import "reflect-metadata";

import { bootstrapDependencyInjection } from "./bootstrap-dependency-injection";
import { bootstrapGlobalSynchronous } from "./bootstrap-global-synchronous";
import { getCommands, getFromEnv } from "./entrypoint-helper";
import {
  startJobQueue,
  startWebServer,
  waitForDatabaseReady,
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
import { ElsaSettings } from "./config/elsa-settings";
import pino, { Logger } from "pino";
import { AuditEventService } from "./business/services/audit-event-service";
import { ReleaseActivationService } from "./business/services/releases/release-activation-service";
import { getFeaturesEnabled } from "./features";
import {
  ADD_USER_COMMAND,
  commandAddUser,
} from "./entrypoint-command-add-user";
import {
  commandSyncDatasets,
  SYNC_DATASETS_COMMAND,
} from "./entrypoint-command-sync-datasets";
import {
  commandDbCreate,
  DB_CREATE_COMMAND,
} from "./entrypoint-command-db-create";
import { commandDbWipe, DB_WIPE_COMMAND } from "./entrypoint-command-db-wipe";

// some Node wide synchronous initialisations
bootstrapGlobalSynchronous();

/**
 * Elsa Data entrypoint - process command line arguments performing operations - the main one which is
 * to start an Elsa Data web server. Other commands are more on-off things like "do db migration" etc)
 */
(async () => {
  // now we are async - we can perform setup operations that themselves need to be async
  // settings and config are mainly of interest only to the web server - but it is possible some other
  // operations might need to use services - so we get all the setup out of the way here
  const { sources, settings, rawConfig, redactedConfig } = await getFromEnv();

  const logger = pino(settings.logger);

  logger.trace("Logger trace test");
  logger.debug("Logger debug test");
  logger.info("Logger info test");
  logger.warn("Logger warn test");
  logger.error("Logger error test");
  logger.fatal("Logger fatal test");

  logger.info(
    redactedConfig,
    `Configuration (redacted) was sourced from "${sources}"`
  );

  // global settings for DI
  const dc = await bootstrapDependencyInjection(
    logger,
    rawConfig.devTesting?.mockAwsCloud
  );

  dc.afterResolution(
    "Database",
    // Callback signature is (token: InjectionToken<T>, result: T | T[], resolutionType: ResolutionType)
    (_t, result, resolutionType) => {
      logger.debug(
        "Expect the resolution type for the database client to be Single = " +
          resolutionType
      );
    },
    { frequency: "Once" }
  );

  // register all these for use in any service that supports DI
  dc.register<ElsaSettings>("Settings", {
    useValue: settings,
  });

  dc.register<Logger>("Logger", {
    useValue: logger,
  });

  const features = await getFeaturesEnabled(dc, settings);

  dc.register<ReadonlySet<string>>("Features", {
    useValue: features,
  });

  // do some DI resolutions nice and early because if DI is broken (as can happen with @decorators)
  // then we should find out now rather than failing later
  logger.info(
    `Sample DI resolve of AuditLogService gave us ${typeof dc.resolve(
      AuditEventService
    )}`
  );
  logger.info(
    `Sample DI resolve of ReleaseActivationService gave us ${typeof dc.resolve(
      ReleaseActivationService
    )}`
  );
  logger.info(
    `Sample DI resolve of AwsDiscoveryService gave us ${typeof dc.resolve(
      "IAwsDiscoveryService"
    )}`
  );

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
        todo.push(async () => waitForDatabaseReady(dc));
        todo.push(async () => startJobQueue(rawConfig));
        todo.push(async () => startWebServer(dc, null));
        break;

      case WEB_SERVER_WITH_SCENARIO_COMMAND:
        if (c.args.length != 1)
          console.error(
            `Command ${WEB_SERVER_WITH_SCENARIO_COMMAND} requires a single number argument indicating which scenario to start with`
          );

        todo.push(async () => waitForDatabaseReady(dc));
        todo.push(async () => startJobQueue(rawConfig));
        todo.push(async () => startWebServer(dc, parseInt(c.args[0])));
        break;

      case ADD_SCENARIO_COMMAND:
        if (c.args.length != 1)
          console.error(
            `Command ${ADD_SCENARIO_COMMAND} requires a single number argument indicating which scenario to add`
          );

        todo.push(async () => commandAddScenario(dc, parseInt(c.args[0])));
        break;

      case ADD_USER_COMMAND:
        if (c.args.length != 1)
          console.error(
            `Command ${ADD_USER_COMMAND} requires a single email address argument indicating a user who should be able to login`
          );

        todo.push(async () => commandAddUser(dc, c.args[0].trim()));
        break;

      case DB_BLANK_COMMAND:
        todo.push(async () => commandDbBlank());
        break;

      case DB_CREATE_COMMAND:
        todo.push(async () => commandDbCreate());
        break;

      case DB_MIGRATE_COMMAND:
        todo.push(async () => commandDbMigrate());
        break;

      case DB_WIPE_COMMAND:
        todo.push(async () => commandDbWipe());
        break;

      case DELETE_DATASETS_COMMAND:
        todo.push(async () => commandDeleteDataset(dc, c.args));
        break;

      case SYNC_DATASETS_COMMAND:
        todo.push(async () => commandSyncDatasets(dc, c.args));
        break;

      default:
        console.error(`Unrecognised command ${c.command}`);
        printHelpText();
        process.exit(1);
    }
  }

  // if no commands were specified - then our default behaviour is to pretend they asked us todo start-web-server
  if (todo.length === 0) {
    await waitForDatabaseReady(dc);
    await startJobQueue(rawConfig);
    await startWebServer(dc, null);
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
  console.log(`${DB_CREATE_COMMAND} - create database if not existing`);
  console.log(`${DB_WIPE_COMMAND} - wipe database content`);
  console.log(
    `${ADD_SCENARIO_COMMAND} <scenario 1|2...> - add in the data for a scenario`
  );
  console.log(`${ADD_USER_COMMAND} <email> - add the user to allow login`);
  console.log(
    `${SYNC_DATASETS_COMMAND} <datasetUri> [...datasetUri] - sync datasets of given URIs`
  );
  // TODO implement some guards on destructive operations
  // console.log(`${DELETE_DATASETS_COMMAND} <datasetUri> - delete specified dataset URI.`);
}
