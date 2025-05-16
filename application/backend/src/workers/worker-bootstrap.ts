import { Logger, pino } from "pino";
import { bootstrapDependencyInjection } from "../bootstrap-dependency-injection";
import { bootstrapSettings } from "../bootstrap-settings";
import { getDirectConfig } from "../config/config-load";
import { ElsaSettings } from "../config/elsa-settings";
import { getFeaturesEnabled } from "../features";

/**
 * In our Worker threads we need to independently bootstrap things - as these
 * objects cannot be passed in from the main thread. All we can get is
 * the config as a raw JSON object.
 *
 * @param configJson
 * @param workerContextName
 */
export async function setupWorkerFromConfigJson(
  configJson: any,
  workerContextName: string,
) {
  // this checks the JSON matches the config schema and returns us a strongly typed object
  const configObject = await getDirectConfig(configJson);

  // which we then turn into an actual rich settings object
  const settings = await bootstrapSettings(configObject);

  // we create a logger that always has a field telling us the worker context - allowing
  // us to separate out job logs in CloudWatch
  const logger = pino(settings.logger).child({ context: workerContextName });

  // global settings for DI
  const dc = await bootstrapDependencyInjection(
    logger,
    settings.devTesting?.mockAwsCloud,
  );

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

  return {
    settings,
    features,
    logger,
    dc,
  };
}

/**
 * Promise that can be awaited to sleep a number of microseconds.
 *
 * @param ms
 */
export function sleepMicroseconds(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
