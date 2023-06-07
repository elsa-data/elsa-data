import { parseMeta } from "./meta/meta-parser";
import { ProviderAwsSecretsManager } from "./providers/provider-aws-secrets-manager";
import { ProviderGcpSecretsManager } from "./providers/provider-gcp-secrets-manager";
import { ProviderFile } from "./providers/provider-file";
import { configZodDefinition, ElsaConfigurationType } from "./config-schema";
import { ProviderOsxKeychain } from "./providers/provider-osx-keychain";
import { ProviderLinuxPass } from "./providers/provider-linux-pass";
import jsonpath from "jsonpath";
import _ from "lodash";

const env_prefix = "ELSA_DATA_CONFIG_";

/**
 * Given a meta configuration description (a string listing a sequence of config
 * providers), this loads all the relevant configs in order and returns them
 * merged and loaded via Zod schema checking. Env variables will be late bound
 * to be able to also set config values.
 *
 * @param meta a string of source of configuration information e.g "file(a) aws-secret(b)"
 */
export async function getMetaConfig(
  meta: string
): Promise<ElsaConfigurationType> {
  // the meta syntax tells us where to source configuration from and in what order
  const metaProviders = parseMeta(meta);

  // the raw config JSON as loaded from the sources
  const rawConfigs = [];

  for (const mp of metaProviders) {
    let providerConfig;
    switch (mp.providerToken.value) {
      case "aws-secret":
        providerConfig = await new ProviderAwsSecretsManager(
          mp.argTokens
        ).getConfig();
        break;
      case "gcloud-secret":
        providerConfig = await new ProviderGcpSecretsManager(
          mp.argTokens
        ).getConfig();
        break;
      case "file":
        providerConfig = await new ProviderFile(mp.argTokens).getConfig();
        break;
      case "osx-keychain":
        providerConfig = await new ProviderOsxKeychain(
          mp.argTokens
        ).getConfig();
        break;
      case "linux-pass":
        providerConfig = await new ProviderLinuxPass(mp.argTokens).getConfig();
        break;
      default:
        throw new Error(
          `unrecognised configuration provider ${mp.providerToken.value}`
        );
    }
    rawConfigs.push(providerConfig);
  }

  let configObject: ElsaConfigurationType = {} as ElsaConfigurationType;

  // one by one merge each config in order into the config object
  for (const initialRawConfig of rawConfigs) {
    configObject = mergeNewConfig(configObject, initialRawConfig, [
      "superAdmins",
      "datasets",
      "dacs",
      "sharers",
    ]);
  }

  // generalise this - but for proper functioning of other aspects of the DAC service - we must ensure
  // that these are unique within the instance
  {
    const idSet = new Set<string>();
    for (const c of configObject.dacs || []) {
      idSet.add(c.id);
    }
    if (idSet.size !== (configObject.dacs || []).length)
      throw new Error(
        "The 'id' field of the configuration 'dacs' array must be unique"
      );
  }

  // similarly things will go horribly wrong if dataset uris are repeated
  {
    const uriSet = new Set<string>();
    for (const c of configObject.datasets || []) {
      uriSet.add(c.uri);
    }
    if (uriSet.size !== (configObject.datasets || []).length)
      throw new Error(
        "The 'uri' field of the configuration 'datasets' array must be unique"
      );
  }

  const trySetEnvironmentVariableString = (
    env_suffix: string,
    path: string
  ) => {
    const v = process.env[`${env_prefix}${env_suffix}`];
    if (v) _.set(configObject, path, v);
  };
  const trySetEnvironmentVariableInteger = (
    env_suffix: string,
    path: string
  ) => {
    const v = process.env[`${env_prefix}${env_suffix}`];
    if (v) _.set(configObject, path, parseInt(v));
  };

  // TODO a mechanism that perhaps _parses_ env names - and works out the path itself..
  // (i.e. replace _ with . and capitalise! but better)

  trySetEnvironmentVariableString(
    "SERVICE_DISCOVERY_NAMESPACE",
    "serviceDiscoveryNamespace"
  );
  trySetEnvironmentVariableString("AWS_TEMP_BUCKET", "aws.tempBucket");
  trySetEnvironmentVariableString(
    "CLOUDFLARE_SIGNING_ACCESS_KEY_ID",
    "cloudflare.signingAccessKeyId"
  );
  trySetEnvironmentVariableString(
    "CLOUDFLARE_SIGNING_SECRET_ACCESS_KEY",
    "cloudflare.signingSecretAccessKey"
  );
  trySetEnvironmentVariableString("DEPLOYED_URL", "deployedUrl");

  trySetEnvironmentVariableString(
    "HTTP_HOSTING_SESSION_SECRET",
    "httpHosting.session.secret"
  );
  trySetEnvironmentVariableString(
    "HTTP_HOSTING_SESSION_SALT",
    "httpHosting.session.salt"
  );
  trySetEnvironmentVariableInteger("HTTP_HOSTING_PORT", "httpHosting.port");
  trySetEnvironmentVariableString("HTTP_HOSTING_HOST", "httpHosting.host");

  trySetEnvironmentVariableString("LOGGER_LEVEL", "logger.level");

  trySetEnvironmentVariableString("MAILER_OPTIONS", "mailer.options");
  trySetEnvironmentVariableString("MAILER_DEFAULTS", "mailer.defaults");
  trySetEnvironmentVariableString("MAILER_MODE", "mailer.mode");

  // perform validation on the final config object and return it transformed
  // (the transform will do type coercion and setting defaults)
  try {
    return configZodDefinition.strict().parse(configObject);
  } catch (e) {
    console.warn(`failed strict parsing: ${e}`);
    return configZodDefinition.parse(configObject);
  }
}

/**
 * Give the raw JSON of configuration, return the data schema checked but otherwise passed through.
 * This function is drop in replacement for getMetaConfig - but is useful in
 * some testing situations.
 *
 * @param config
 */
export async function getDirectConfig(
  config: any
): Promise<ElsaConfigurationType> {
  return configZodDefinition.strict().parse(config);
}

/**
 * Process/merge in a new configuration file - but with some special helper logic that allows array
 * manipulation and JSONpath queries.
 *
 * @param startingConfig the starting configuration that we are looking to apply array options to
 * @param newConfig a new configuration that may or may not have special logic fields (at the top level)
 * @param arrayMarkers an array of "key names" that we want to enable this array functionality for (e.g. ["datasets", "admins"])
 */
function mergeNewConfig(
  startingConfig: any,
  newConfig: any,
  arrayMarkers: string[]
): any {
  // start with the intention of returning back exactly what we started with
  // we will now mutate this
  const returnConfig = _.cloneDeep(startingConfig);

  // we don't want to accidentally refer to this so null it out
  startingConfig = null;

  // we want to allow 'deletion' of config entries using a pretty loose logic where they can specify anything
  // that looks like an id and we broadly search for it
  const idPresent = (possibleId: string, obj: any): boolean => {
    for (const [k, v] of Object.entries(obj)) {
      if (k === "uri" && v === possibleId) return true;
      if (k === "id" && v === possibleId) return true;
      if (k === "name" && v === possibleId) return true;
      if (k === "sub" && v === possibleId) return true;
    }

    return false;
  };

  // our first step is we want to apply any of the "array modifier" keys we find in the new config
  // these only are allowed as top-level keys

  for (const am of arrayMarkers) {
    const addKey = `+${am}`;
    const deleteKey = `-${am}`;
    const replaceKey = am;

    if (replaceKey in newConfig) {
      // the presence of the key name directly means we are doing a straight "replace" - and hence can't be doing an add or delete
      if (addKey in newConfig || deleteKey in newConfig) {
        throw new Error(
          `If a configuration has a key '${replaceKey}' to replace array content - it does not make any sense to also have a '${addKey}' or '${deleteKey}' key`
        );
      }

      returnConfig[am] = newConfig[am];

      delete newConfig[replaceKey];
    } else {
      // it may make sense to have BOTH a + and a - so we need to be cool with both appearing

      if (addKey in newConfig) {
        returnConfig[am].push(...newConfig[addKey]);

        // strip out the +?? key as we have handled it and we don't want is handled by lodash merge
        delete newConfig[addKey];
      }

      if (deleteKey in newConfig) {
        for (const toDelete of newConfig[deleteKey]) {
          const startLength = returnConfig[am].length;
          returnConfig[am] = returnConfig[am].filter(
            (v: any) => !idPresent(toDelete, v)
          );
          if (startLength === returnConfig[am].length) {
            throw new Error(
              `The configuration instruction ${deleteKey} of ${toDelete} did not do anything as no existing config had an entry with an id,uri or name of ${toDelete}`
            );
          }
        }

        // strip out the -?? key as we have handled it and we don't want is handled by lodash merge
        delete newConfig[deleteKey];
      }
    }
  }

  // our top-level keys can be complex JSON path expressions that resolve to a single value
  // this lets us set password fields in arrays for instance
  for (const [key, value] of Object.entries(newConfig)) {
    // if the key is just regular alphanumeric then we can let it be handled normally
    if (/^[A-Za-z0-9]*$/.test(key)) continue;

    // find our what already exists according to this complex query
    const matching = jsonpath.query(returnConfig, key);

    // we do not want to use this mechanism for replacing multiple nodes
    if (matching.length > 1)
      throw new Error(
        `Configuration handling for complex key ->${key}<- resulted in a path value that was not a single string or number - which is incompatible with how this mechanism is designed to be used`
      );

    if (matching.length === 0) {
      // if the value is not already present - jsonpath apply can't really help us out because it only applies to existing objects
      throw new Error(
        `Configuration handling for complex key ->${key}<- can _currently_ only replace existing fields, not create them new - so you may need to add an empty field in an earlier configuration i.e a blank secret ""`
      );
    } else {
      // if there are already values present matching this key - they cannot be objects or arrays
      if (
        !_.isString(matching[0]) &&
        !_.isNumber(matching[0]) &&
        !_.isNil(matching[0])
      )
        throw new Error(
          `Configuration handling for complex key ->${key}<- resulted in a path value that was not a single string or number - which is incompatible with how this mechanism is designed to be used`
        );

      // the value we want to set cannot be anything but a string/number (we could probably check this earlier)
      if (!_.isString(value) && !_.isNumber(value))
        throw new Error(
          `Configuration handling for complex key ->${key}<- resulted in a value to be set that was not a single string or number - which is incompatible with how this mechanism is designed to be used`
        );

      // now that we have ensured they aren't getting up to anything funny - we apply the replacement of the single value
      jsonpath.apply(returnConfig, key, (x) => value);
    }

    delete newConfig[key];
  }

  // all the "special" fields have been removed from newConfig and we have applied their logic ourselves
  // now we can just use the basis Lodash merge functionality for the rest of the newConfig
  return _.merge(returnConfig, newConfig);
}
