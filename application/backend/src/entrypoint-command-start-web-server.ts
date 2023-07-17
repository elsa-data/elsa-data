import { App } from "./app";
import { insertScenario1 } from "./test-data/scenario/insert-scenario1";
import Bree from "bree";
import { DependencyContainer } from "tsyringe";
import path from "path";
import { sleep } from "edgedb/dist/utils";
import { DatasetService } from "./business/services/dataset-service";
import { getServices } from "./di-helpers";
import { MailService } from "./business/services/mail-service";
import { createServer } from "http";
import { createHttpTerminator } from "http-terminator";
import { DB_MIGRATE_COMMAND } from "./entrypoint-command-db-migrate";
import { constants } from "fs";
import { access } from "fs/promises";
import { IPLookupService } from "./business/services/ip-lookup-service";
import { ElsaConfigurationType } from "./config/config-schema";

export const WEB_SERVER_COMMAND = "web-server";
export const WEB_SERVER_WITH_SCENARIO_COMMAND = "web-server-with-scenario";

/**
 * A command that starts (and waits) for the Elsa Data web server to serve
 * the Elsa Data application.
 *
 * @param dc
 * @param scenario
 */
export async function startWebServer(
  dc: DependencyContainer,
  scenario: number | null
): Promise<number> {
  const { settings, logger, features } = getServices(dc);

  // in a real deployment - "add scenario", "db blank" etc would all be handled by 'commands'.
  // we have one dev use case though - where we nodemon the local code base and restart the server
  // each time code changes - and in that case we want the server startup itself to set up the db
  if (scenario) {
    if (process.env.NODE_ENV === "development") {
      logger.info(`Resetting the database to contain scenario ${scenario}`);

      // TODO allow different scenarios to be inserted based on the value
      switch (scenario) {
        case 1:
          await insertScenario1(dc);
          break;
        default:
          break;
      }
    } else {
      // a simple guard to hopefully stop an accident in prod
      console.log(
        "Only 'development' Node environments can start the web server with a scenario - as scenarios will blank out the existing data"
      );

      return 1;
    }
  }

  // Insert datasets from config
  const datasetService = dc.resolve(DatasetService);
  await datasetService.configureDataset(settings.datasets);

  // create the actual webserver/app
  const app = new App(dc, settings, logger, features);
  const server = await app.setupServer();

  const mailService = dc.resolve(MailService);
  mailService.setup();

  const ipLookupService = dc.resolve(IPLookupService);
  await ipLookupService.setup();

  try {
    // this waits until the server has started up - but does not wait for the server to close down
    await server.listen({
      port: settings.httpHosting.port,
      host: settings.httpHosting.host,
    });

    // we don't want to fall out the end of the 'start-server' command until we have been signalled
    // to shut down
    while (true) {
      // TODO detect close() event from the server
      await sleep(5000);
    }
  } catch (err) {
    logger.error(err);

    return 1;
  }
}

/**
 * A function to start up the background job handler. This is only ever started at the
 * same time as the web server but was split out because it is the only code that needs
 * the raw 'config'.
 *
 * @param config
 */
export async function startJobQueue(config: ElsaConfigurationType) {
  let root = path.resolve("jobs");

  const convertFileNameTsToJs = (tsFile: string) =>
    tsFile.replace(/.ts$/, ".js");

  const breeJobs: Bree.JobOptions[] = [];

  // A long service job that always run
  const jobFileName = "entrypoint-job-handler.ts";

  // Check whether we need to take file from `/dist` directory
  let isCompiled = false;
  try {
    await access(path.resolve("jobs", jobFileName), constants.R_OK);
  } catch (e) {
    isCompiled = true;
    root = path.resolve("server/dist/jobs");
  }

  breeJobs.push({
    name: isCompiled ? convertFileNameTsToJs(jobFileName) : jobFileName,
    worker: {
      workerData: config,
    },
  });

  // If specified for auto-update egress records
  const cronExpressionInterval = config.datasetEgress?.updateInterval;

  if (cronExpressionInterval) {
    const jobEgressUpdateFileName = "entrypoint-data-egress-update-handler.ts";

    breeJobs.push({
      name: isCompiled
        ? convertFileNameTsToJs(jobEgressUpdateFileName)
        : jobEgressUpdateFileName,
      cron: cronExpressionInterval,
      worker: {
        workerData: config,
      },
    });
  }

  const bree = new Bree({
    root: root,
    jobs: breeJobs,
  });

  await bree.start();
}

/**
 * A function that exposes a very simple web server relaying error messages
 * out - until a successful query against the database has been made.
 *
 * This provides useful feedback on first startup as the service cannot
 * proceed until the initial schema is migrated.
 */
export async function waitForDatabaseReady(dc: DependencyContainer) {
  const { settings, logger, edgeDbClient } = getServices(dc);

  // a simple test to exercise the base db/schema expectations
  const dbTest = async (): Promise<string | null> => {
    try {
      // this is likely to fail if the actual db connection is broken
      const fortyTwoResult = await edgeDbClient.query("select 42;");

      if (
        !fortyTwoResult ||
        !(fortyTwoResult.length === 1) ||
        !(fortyTwoResult[0] === 42)
      ) {
        return "Simple EdgeDb select of 42 did not return the correct value";
      }

      // this is likely to fail if we haven't yet performed the first migration
      const userResult = await edgeDbClient.query(
        "select permission::User { id };"
      );

      if (!userResult) {
        return "Simple EdgeDb select of User failed to return a valid result";
      }

      // null means success - we can continue
      return null;
    } catch (e: any) {
      logger.error(e, "Database test failure");

      return e.toString();
    }
  };

  const startDate = new Date();

  const immediateTest = await dbTest();

  // we can do an immediate test and if the database is all ready for us then lets return
  // on to spinning up the 'real' webserver
  if (!immediateTest) {
    logger.info("Database test was successful - proceeding to web serving");
    return;
  }

  let successQuery = false;

  const server = createServer(async (request, response) => {
    try {
      const pageLoadTest = await dbTest();

      if (pageLoadTest) {
        response.writeHead(200);
        response.write(`<html>
<body>
<p>A representative database query needs to succeed before
 the web server starts - but is currently failing with the error message below.
 Have you performed the initial <pre>${DB_MIGRATE_COMMAND}</pre>?
 </p>
 <pre>${pageLoadTest}</pre>
 </body>
 </html>`);
        response.end();
      } else {
        successQuery = true;

        response.writeHead(200);
        response.write(
          "<html><body>Database query success - proceeding to web serving</body></html>"
        );
        response.end();
      }
    } catch (e) {
      response.writeHead(200);
      response.write(`<html><body>${e}</body></html>`);
      response.end();

      logger.error(e, "Database test web server failure");
    }
  });

  const httpTerminator = createHttpTerminator({
    server,
  });

  await server.listen(settings.httpHosting.port);

  let count = 0;
  while (!successQuery) {
    await sleep(1000);

    // we also give a way of proceeding *without* the test being triggered via a web visit
    // we don't want to do this every second though as there'd be *lots* of logs of failures...
    if (count % 60 === 0)
      if (!(await dbTest())) {
        break;
      }

    count++;
  }

  const endDate = new Date();
  const seconds = (endDate.getTime() - startDate.getTime()) / 1000;

  logger.info(
    `Database test was successful (after ${seconds} seconds of database testing) - proceeding to web serving`
  );

  await httpTerminator.terminate();
}
