// must be first and before any DI is used
import "reflect-metadata";

import { bootstrapDependencyInjection } from "./bootstrap-dependency-injection";
import { bootstrapGlobalSynchronous } from "./bootstrap-global-synchronous";
import { getCommands, getSettingsFromEnv } from "./entrypoint-helper";
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
import assert from "assert";

// some Node wide synchronous initialisations
bootstrapGlobalSynchronous();

/**
 * Elsa Data entrypoint - process command line arguments performing operations - the main one which is
 * to start an Elsa Data web server. Other commands are more on-off things like "do db migration" etc)
 */
(async (): Promise<number> => {
  // now we are async - we can perform setup operations that themselves need to be async
  // we get all the setup out of the way here
  const { success, sources, rawConfig, redactedConfig, issues, settings } =
    await getSettingsFromEnv();

  // we are taking a punt here that the logger settings have been constructed - but if not we will still
  // construct the logger with defaults
  const logger = pino(settings?.logger ?? { level: "debug" });

  // without a valid configuration/settings we are going to log and stop here
  if (!success) {
    logger.fatal(redactedConfig, "Configuration (redacted) dump");

    for (const i of issues) {
      logger.fatal(i, "Configuration issue");
    }

    return 1;
  }

  // even if successful we can still encounter issues - so we log them
  if (issues && issues.length > 0) {
    for (const i of issues) {
      logger.warn(i, "Configuration issue");
    }
  }

  assert(settings);

  // global settings for DI
  const dc = await bootstrapDependencyInjection(
    logger,
    settings.devTesting?.mockAwsCloud
  );

  // THE DI CHECKING NEEDS TO BE WRITTEN SO THAT IS ACTUALLY STOPS IF DI FAILING - NOT JUST
  // PRINTS MESSAGES

  // a one-off check that ensures our database object is registered as a singleton
  // this kind of checks DI is working overall
  /*dc.afterResolution(
    "Database",
    // Callback signature is (token: InjectionToken<T>, result: T | T[], resolutionType: ResolutionType)
    (_t, result, resolutionType) => {
      if (resolutionType !== "Single")
        throw new Error("Dependency injection database resolution failed as object was not singleton");
    },
    { frequency: "Once" },
  );
    // do some DI resolutions nice and early because if DI is broken (as can happen with @decorators)
  // then we should find out now rather than failing later
  logger.debug(
    `Sample DI resolve of AuditLogService gave us ${typeof dc.resolve(
      AuditEventService,
    )}`,
  );
  logger.debug(
    `Sample DI resolve of ReleaseActivationService gave us ${typeof dc.resolve(
      ReleaseActivationService,
    )}`,
  );
  logger.debug(
    `Sample DI resolve of AwsDiscoveryService gave us ${typeof dc.resolve(
      "IAwsDiscoveryService",
    )}`,
  ); */

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

  const commands = getCommands(process.argv);
  const todo = [];

  logger.debug(`Entry point commands are ${JSON.stringify(commands)}`);

  for (const c of commands) {
    switch (c.command) {
      case "help":
        printHelpText(logger);
        return 0;

      case "echo":
        // TODO consider if this is in anyway useful / too dangerous
        todo.push(async () => {
          logger.info(c.args);
          return 0;
        });
        break;

      case "config":
        todo.push(async () => {
          // as a 'bonus' we also test the logging out
          logger.info(
            `Logger level is currently set at '${logger.level}' - test messages at all levels to follow`
          );
          logger.trace("Logger trace test");
          logger.debug("Logger debug test");
          logger.info("Logger info test");
          logger.warn("Logger warn test");
          logger.error("Logger error test");
          logger.fatal("Logger fatal test");

          // dump out our sources and the *unredacted* config
          logger.info(`Configuration sources = '${sources}'`);
          logger.info(rawConfig, `Configuration dump`);

          return 0;
        });
        break;

      case WEB_SERVER_COMMAND:
        todo.push(async () => waitForDatabaseReady(dc));
        todo.push(async () => startJobQueue(rawConfig));
        todo.push(async () => startWebServer(dc, null));
        break;

      case WEB_SERVER_WITH_SCENARIO_COMMAND:
        if (c.args.length != 1) {
          logger.fatal(
            `Command ${WEB_SERVER_WITH_SCENARIO_COMMAND} requires a single number argument indicating which scenario to start with`
          );
          return 1;
        }

        todo.push(async () => waitForDatabaseReady(dc));
        todo.push(async () => startJobQueue(rawConfig));
        todo.push(async () => startWebServer(dc, parseInt(c.args[0])));
        break;

      case ADD_SCENARIO_COMMAND:
        if (c.args.length != 1) {
          logger.fatal(
            `Command ${ADD_SCENARIO_COMMAND} requires a single number argument indicating which scenario to add`
          );
          return 1;
        }

        todo.push(async () => commandAddScenario(dc, parseInt(c.args[0])));
        break;

      case ADD_USER_COMMAND:
        if (c.args.length != 1) {
          logger.fatal(
            `Command ${ADD_USER_COMMAND} requires a single email address argument indicating a user who should be able to login`
          );
          return 1;
        }

        todo.push(async () => commandAddUser(dc, c.args[0].trim()));
        break;

      case DB_BLANK_COMMAND:
        todo.push(async () => commandDbBlank(logger));
        break;

      case DB_CREATE_COMMAND:
        todo.push(async () => commandDbCreate(logger));
        break;

      case DB_MIGRATE_COMMAND:
        todo.push(async () => commandDbMigrate(logger));
        break;

      case DB_WIPE_COMMAND:
        todo.push(async () => commandDbWipe(logger));
        break;

      case DELETE_DATASETS_COMMAND:
        todo.push(async () => commandDeleteDataset(dc, c.args));
        break;

      case SYNC_DATASETS_COMMAND:
        todo.push(async () => commandSyncDatasets(dc, c.args));
        break;

      default:
        logger.error(`Unrecognised command ${c.command}`);
        printHelpText(logger);
        return 1;
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
  return 0;
})().then((r) => {
  process.exit(r);
});

/**
 * Help text for the commands that can be executed
 */
function printHelpText(logger: Logger) {
  // We only actually want these to be invoked as part of infrastructure - so no need to show
  // these to the admins
  // logger.info(`${WEB_SERVER_COMMAND} - launch Elsa Data web server and wait`);
  //logger.info(
  //  `${WEB_SERVER_WITH_SCENARIO_COMMAND} <scenario 1|2...> - launch Elsa Data web server and always blank/insert the given scenario on start up`,
  //);

  logger.info(`config - dump (unredacted) configuration`);
  // TODO implement some guards on destructive operations
  //      console.log(`${DB_BLANK_COMMAND} [hostname] - delete all data from the database, requires hostname to be specified if in production`);
  logger.info(`${DB_BLANK_COMMAND}`);
  logger.info(`${DB_MIGRATE_COMMAND} - migrate database schema`);
  logger.info(`${DB_CREATE_COMMAND} - create database if not existing`);
  logger.info(`${DB_WIPE_COMMAND} - wipe database content`);
  logger.info(
    `${ADD_SCENARIO_COMMAND} <scenario 1|2...> - add in the data for a scenario`
  );
  logger.info(
    `${ADD_USER_COMMAND} <email> - allow the given email to be able to log in to this instance`
  );
  logger.info(
    `${SYNC_DATASETS_COMMAND} <datasetUri> [...<datasetUri>] - sync datasets of given URIs`
  );
  // TODO implement some guards on destructive operations
  // console.log(`${DELETE_DATASETS_COMMAND} <datasetUri> - delete specified dataset URI.`);
}
