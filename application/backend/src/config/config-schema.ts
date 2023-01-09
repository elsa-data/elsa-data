import convict from "convict";
import { parseMeta } from "./meta/meta-parser";
import { ProviderAwsSecretsManager } from "./providers/provider-aws-secrets-manager";
import { ProviderFile } from "./providers/provider-file";
import {
  configDefinition,
  loggerTransportTargetsArray,
} from "./config-constants";
import { ProviderOsxKeychain } from "./providers/provider-osx-keychain";
import { ProviderLinuxPass } from "./providers/provider-linux-pass";

convict.addFormat(loggerTransportTargetsArray);

// an array of user records designated in the config for extra permissions etc
convict.addFormat({
  name: "array",
  validate: function (items: any[], schema) {
    if (!Array.isArray(items)) {
      throw new Error("Must be of type Array");
    }

    for (const child of items) {
      convict(schema.children).load(child).validate();
    }
  },
});

// a TLS artifact that we fetch and possibly save to disk for use in TLS connections
convict.addFormat({
  name: "tls",
  validate(val: any, schema: convict.SchemaObj) {
    if (val) {
      if (!val.startsWith("-----BEGIN"))
        throw new Error("TLS must start with ASCII armor -----BEGIN");
    }
  },
  coerce: function (val) {
    if (val) return val.replaceAll("\\n", "\n");
    return val;
  },
});

/**
 * Process the raw config JSON data - before it goes to convict - allowing us to have a feature
 * by which arrays can be grown or shrunk using a
 * "+key" or "-key" notation.
 *
 * @param rawConfigs the JSON config files as loaded directly from disk/store
 * @param arrayMarkers an array of "key names" that we want to enable this array functionality for (e.g. ["datasets", "admins"])
 */
function handleConfigArraysBeforeConvict(
  rawConfigs: any[],
  arrayMarkers: string[]
): { strippedConfigs: any[]; arrayProcessed: { [k: string]: any[] } } {
  // we want to allow 'deletion' of config entries using a pretty loose logic where they can specify anything
  // the looks like an id and we broadly search for it
  const idPresent = (possibleId: string, obj: any): boolean => {
    for (const [k, v] of Object.entries(obj)) {
      if (k === "uri" && v === possibleId) return true;
      if (k === "id" && v === possibleId) return true;
      if (k === "name" && v === possibleId) return true;
    }

    return false;
  };

  const strippedConfigs: any[] = [];
  const arrayProcessed: { [k: string]: any[] } = {};

  for (const rc of rawConfigs) {
    // copy the raw config before we mutate
    const newStrippedConfig = { ...rc };

    for (const am of arrayMarkers) {
      // our starting point is always a blank array
      if (!(am in arrayProcessed)) arrayProcessed[am] = [];

      const addKey = `+${am}`;
      const deleteKey = `-${am}`;
      const replaceKey = am;

      if (replaceKey in newStrippedConfig) {
        // the presence of the key name directly means we are doing a straight "replace" - and hence can't be doing an add or delete
        if (addKey in newStrippedConfig || deleteKey in newStrippedConfig) {
          throw new Error(
            `If a configuration has a key '${replaceKey}' to replace array content - it does not make any sense to also have a '${addKey}' or '${deleteKey}' key`
          );
        }

        arrayProcessed[am] = newStrippedConfig[am];

        // this won't particularly matter - but set this to a nice safe [] for convict
        newStrippedConfig[am] = [];
      } else {
        // it may make sense to have BOTH a + and a - so we need to be cool with both appearing

        if (addKey in newStrippedConfig) {
          arrayProcessed[am].push(...newStrippedConfig[addKey]);

          // strip out the +?? key as we have handled it and we don't want to pass it on to convict (which won't understand it)
          delete newStrippedConfig[addKey];
        }

        if (deleteKey in newStrippedConfig) {
          for (const toDelete of newStrippedConfig[deleteKey]) {
            const startLength = arrayProcessed[am].length;
            arrayProcessed[am] = arrayProcessed[am].filter(
              (v) => !idPresent(toDelete, v)
            );
            if (startLength === arrayProcessed[am].length) {
              throw new Error(
                `The configuration instruction ${deleteKey} of ${toDelete} did not do anything as no existing config had an entry with an id,uri or name of ${toDelete}`
              );
            }
          }

          // strip out the -?? key as we have handled it and we don't want to pass it on to convict (which won't understand it)
          delete newStrippedConfig[deleteKey];
        }
      }
    }

    strippedConfigs.push(newStrippedConfig);
  }

  return {
    strippedConfigs: strippedConfigs,
    arrayProcessed: arrayProcessed,
  };
}

/**
 * Give the raw JSON of configuration, return the data loaded into Convict.
 * This function is drop in replacement for getMetaConfig - but is useful in
 * some testing situations.
 *
 * @param config
 */
export async function getDirectConfig(
  config: any
): Promise<convict.Config<any>> {
  const convictConfig = convict(configDefinition, {});

  convictConfig.load(config);
  // perform validation
  convictConfig.validate({ allowed: "strict" });

  return convictConfig;
}

/**
 * Given a meta configuration description (a string listing a sequence of config
 * providers), this loads all the relevant configs in order and returns them
 * merged and loaded into convict. Convict will do the handling of default values
 * and overrides via ENV variables.
 *
 * @param meta
 */
export async function getMetaConfig(
  meta: string
): Promise<convict.Config<any>> {
  // setup our configuration schema
  const convictConfig = convict(configDefinition, {});

  const metaProviders = parseMeta(meta);
  const foundRawConfigs = [];

  for (const mp of metaProviders) {
    let providerConfig;
    switch (mp.providerToken.value) {
      case "aws-secret":
        providerConfig = await new ProviderAwsSecretsManager(
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
    foundRawConfigs.push(providerConfig);
  }

  // ok here we do some hacky magic
  // we want to support "array" elements in convict to have the ability to add or remove in different config files
  // but convict will not support this - so we implement it ourselves as a phase before even getting to convict

  // preprocess to take all the array entries out of the configs
  const { arrayProcessed, strippedConfigs } = handleConfigArraysBeforeConvict(
    foundRawConfigs,
    ["superAdmins", "datasets"]
  );

  // process in convict the configs without arrays
  for (const sc of strippedConfigs) convictConfig.load(sc);

  // add back into convict the arrays as we calculated them
  convictConfig.set("datasets", arrayProcessed["datasets"] as never[]);
  convictConfig.set("superAdmins", arrayProcessed["superAdmins"] as never[]);

  // perform validation
  // the computed array content is still passed into convict here for validation
  convictConfig.validate({ allowed: "strict" });

  return convictConfig;
}
