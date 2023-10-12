import { ProviderMeta } from "./meta/meta-parser";
import { ProviderAwsSecretsManager } from "./providers/provider-aws-secrets-manager";
import { ProviderGcpSecretsManager } from "./providers/provider-gcp-secrets-manager";
import { ProviderFile } from "./providers/provider-file";
import { configZodDefinition, ElsaConfigurationType } from "./config-schema";
import { ProviderOsxKeychain } from "./providers/provider-osx-keychain";
import { ProviderLinuxPass } from "./providers/provider-linux-pass";
import jsonpath from "jsonpath";
import {
  environmentVariableMap,
  trySetEnvironmentVariableInteger,
  trySetEnvironmentVariableString,
} from "./config-load-environment-variable-map";
import { ZodError, ZodIssue, ZodIssueCode } from "zod";
import { cloneDeep, isNumber, isNil, isString, merge, set } from "lodash";

/**
 * The structure returned when we try to load configuration. Handles
 * some error cases without needing to use exceptions - as we want to
 * allow higher layers do things like log the config that failed.
 */
interface ConfigResult {
  // if true, then the config object returns *does* match our configuration
  // schema
  // if false, the config object returned is still a valid object but *does not*
  // match our configuration schema
  success: boolean;

  // a configuration object that is guaranteed to match the schema only if
  // success is true
  config: ElsaConfigurationType;

  // if non-empty, a set of issues which can be reported to the administrator
  // issues can be reported even if success is true
  configIssues: ZodIssue[];
}

/**
 * Given a meta configuration description (a string listing a sequence of config
 * providers), this loads all the relevant configs in order and returns them
 * merged and loaded via Zod schema checking. Env variables will be late bound
 * to be able to also set config values.
 *
 * @param providers an array of meta providers to source configuration information
 * @returns an object with the strictly validated configuration (and empty issue array) OR
 *          an object with a non-strict validated configuration (and a non-empty array of issues) OR
 *          an empty configuration (and a non-empty array of issues)
 */
export async function getMetaConfig(
  providers: ProviderMeta[]
): Promise<ConfigResult> {
  // the raw config JSON as loaded from each provider source (in order)
  const rawConfigs = [];

  for (const mp of providers) {
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

  // whilst we assert a Typescript type here - we are not sure this object is schema correct
  // until *after* we do a Zod check
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

  // TODO a mechanism that perhaps _parses_ env names - and works out the path itself..
  //      (i.e. replace _ with . and capitalise! but better)

  for (const [e, v] of Object.entries(environmentVariableMap)) {
    trySetEnvironmentVariableString(configObject, e, v);
  }

  trySetEnvironmentVariableInteger(
    configObject,
    "HTTP_HOSTING_PORT",
    "httpHosting.port"
  );

  const strictIssuesFound: ZodIssue[] = [];

  // perform validation on the final config object and return it transformed
  // (the transform will do type coercion and setting of defaults)

  try {
    // our best scenario - the config parsed in strict mode so we return that
    return {
      success: true,
      config: configZodDefinition.strict().parse(configObject),
      configIssues: strictIssuesFound,
    };
  } catch (e: any) {
    // fill in the issues to use in the next attempt
    if (e instanceof ZodError) {
      strictIssuesFound.push(...e.issues);
    } else {
      strictIssuesFound.push({
        code: ZodIssueCode.custom,
        path: [],
        message:
          "Strict parsing attempt failed with an exception that was not a ZodError",
      });
    }
  }

  try {
    // our second-best scenario - the config parses - but didn't in strict mode! - so we have a successful
    // config, but we also return the issues from the strict attempt
    return {
      success: true,
      config: configZodDefinition.parse(configObject),
      configIssues: strictIssuesFound,
    };
  } catch (e) {
    // ok - we are at disaster level now
    // we can't actually
    if (e instanceof ZodError) {
      return {
        success: false,
        config: configObject,
        // NOTE: we are returning the strict issues we found previously - as they should be a superset of the issues
        // that causes this failure... so we actually ignore the issues in 'e'
        configIssues: strictIssuesFound,
      };
    } else {
      return {
        success: false,
        config: configObject,
        configIssues: [
          {
            code: ZodIssueCode.custom,
            path: [],
            message: "Parsing failed with an exception that was not a ZodError",
          },
        ],
      };
    }
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
  const returnConfig = cloneDeep(startingConfig);

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
        !isString(matching[0]) &&
        !isNumber(matching[0]) &&
        !isNil(matching[0])
      )
        throw new Error(
          `Configuration handling for complex key ->${key}<- resulted in a path value that was not a single string or number - which is incompatible with how this mechanism is designed to be used`
        );

      // the value we want to set cannot be anything but a string/number (we could probably check this earlier)
      if (!isString(value) && !isNumber(value))
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
  return merge(returnConfig, newConfig);
}
