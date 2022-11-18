import convict from "convict";
import { parseMeta } from "./meta/meta-parser";
import { ProviderAwsSecretsManager } from "./providers/provider-aws-secrets-manager";
import { ProviderFile } from "./providers/provider-file";
import { configDefinition } from "./config-constants";
import { ProviderOsxKeychain } from "./providers/provider-osx-keychain";

// an array of user records designated in the config for extra permissions etc
convict.addFormat({
  name: "user-array",
  validate: function (items: any[], schema) {
    if (!Array.isArray(items)) {
      throw new Error("must be of type Array");
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
      default:
        throw new Error(
          `unrecognised configuration provider ${mp.providerToken.value}`
        );
    }
    convictConfig.load(providerConfig);
  }

  // perform validation
  convictConfig.validate({ allowed: "strict" });

  return convictConfig;
}
