import convict from "convict";
import { ElsaEnvironment, ElsaLocation } from "./elsa-settings";
import { getConfigLocalMac } from "./config-local-mac";
import { getConfigAwsSecretsManager } from "./config-aws-secrets-manager";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { lexVariable, Token } from "./meta/meta-lexer";
import { ProviderBase } from "./providers/provider-base";
import _ from "lodash";
import { parseMeta } from "./meta/meta-parser";
import { ProviderAwsSecretsManager } from "./providers/provider-aws-secrets-manager";
import { ProviderFile } from "./providers/provider-file";

// I don't actually need to add the JSON5 parser to convict as we handle file loading ourselves
// convict.addParser({ extension: "json5", parse: require("json5").parse });

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

const env_prefix = "ELSA_DATA_CONFIG_";

const configDefinition = {
  edgeDb: {
    tlsRootCa: {
      doc: "A single line string (use \\n for breaks) of TLS Root CA used by the TLS of the EdgeDb",
      sensitive: true,
      format: "tls",
      default: undefined,
    },
  },
  oidc: {
    issuerUrl: {
      doc: "The URL of the OIDC issuer for authn",
      format: "*",
      default: null,
      nullable: false,
    },
    clientId: {
      doc: "The client id registered with the OIDC issuer",
      format: "*",
      default: null,
      nullable: false,
    },
    clientSecret: {
      doc: "The client secret of the OIDC issuer",
      format: "*",
      sensitive: true,
      default: null,
      nullable: false,
    },
  },
  session: {
    secret: {
      doc: "A long string secret that is used as part of the session encryption",
      format: "*",
      sensitive: true,
      default: null,
      nullable: false,
      env: `${env_prefix}SESSION_SECRET`,
    },
    salt: {
      doc: "A 16 character salt that is used as part of the session encryption",
      format: "*",
      sensitive: true,
      default: null,
      nullable: false,
      env: `${env_prefix}SESSION_SALT`,
    },
  },
  aws: {
    signingAccessKeyId: {
      doc: "An AWS access key id for a user with read permission of files that can be shared via S3 signed URLs",
      format: "*",
      sensitive: false,
      default: undefined,
      env: `${env_prefix}AWS_SIGNING_ACCESS_KEY_ID`,
    },
    signingSecretAccessKey: {
      doc: "An AWS secret access key for a user with read permission of files that can be shared via S3 signed URLs",
      format: "*",
      sensitive: true,
      default: undefined,
      env: `${env_prefix}AWS_SIGNING_SECRET_ACCESS_KEY`,
    },
  },
  // the rate limiting options are basically a pass through to the Fastify rate limit plugin
  // for the moment we have picked only a subset of the full configuration items
  rateLimit: {
    max: {
      doc: "The maximum number of API calls allowed from a single IP in the time window",
      format: "int",
      sensitive: false,
      default: 1000,
      nullable: false,
    },
    timeWindow: {
      doc: "The number of milliseconds in the time window in which rate limit events are measured",
      format: "int",
      sensitive: false,
      default: 60 * 1000,
      nullable: false,
    },
    allowList: {
      doc: "The IP addresses of any clients allowed to bypass rate limiting",
      format: Array,
      sensitive: false,
      default: [],
      nullable: false,
    },
  },
  rems: {
    botUser: {
      doc: "The REMS user",
      format: "*",
      default: undefined,
    },
    botKey: {
      doc: "The REMS key",
      sensitive: true,
      format: "*",
      default: undefined,
    },
  },
  ontoFhirUrl: {
    doc: "The FHIR ontology service",
    format: "*",
    default: "",
  },
  port: {
    doc: "The port to bind.",
    format: "port",
    default: 3000,
    env: `${env_prefix}PORT`,
    arg: "port",
  },
  superAdmins: {
    doc: "A collection of users with super administration rights i.e. the ability to alter other user rights",
    format: "user-array",
    default: [],

    children: {
      id: {
        doc: "The user subject id",
        format: "*",
        default: null,
      },
      email: {
        doc: "The user email",
        format: "*",
        default: null,
      },
    },
  },
};

/**
 * Scours the world finding us the consolidated configuration values for the given
 * environment and location. This might involve reading specific configs from disk,
 * or sourcing values from keychains or secrets.
 *
 * @param environment
 * @param location
 */
export async function getConfig(
  environment: ElsaEnvironment,
  location: ElsaLocation
) {
  // setup our configuration schema

  const convictConfig = convict(configDefinition, {});

  // first step is to identify the environment and load that
  //const env = config.get("env");

  convictConfig.loadFile([
    `./config/location-${location}.json5`,
    `./config/environment-${environment}.json5`,
    "./config/base.json5",
  ]);

  // TODO: this hack will be replaced by a proper meta config definition

  if (location === "local-mac") {
    // when running on the local-mac we also want the ability to use AWS secrets
    // if configured with AWS permissions
    const stsClient = new STSClient({});

    try {
      // will fail unless we have valid AWS credentials
      const _identity = await stsClient.send(new GetCallerIdentityCommand({}));

      convictConfig.load(await getConfigAwsSecretsManager(true));
    } catch {
      // if we were not in AWS OR the secret doesn't load then plough on irrespective (this is local-mac!)
    }

    convictConfig.load(await getConfigLocalMac());
  }

  if (location === "aws")
    convictConfig.load(await getConfigAwsSecretsManager(false));

  // perform validation
  convictConfig.validate({ allowed: "strict" });

  return convictConfig;
}

export async function getMetaConfig(meta: string) {
  // setup our configuration schema

  const convictConfig = convict(configDefinition, {});

  const metaProviders = parseMeta(meta);

  for (const mp of metaProviders) {
    if (mp.providerToken.value === "aws-secret") {
      const c = await new ProviderAwsSecretsManager(mp.argTokens).getConfig();
      convictConfig.load(c);
    }
    if (mp.providerToken.value === "file") {
      const c = await new ProviderFile(mp.argTokens).getConfig();
      convictConfig.load(c);
    }
    if (mp.providerToken.value === "gcloud-secret") {
      throw new Error("not implemented");
    }
  }

  // TODO: this hack will be replaced by a proper meta config definition

  /*if (location === "local-mac") {
    // when running on the local-mac we also want the ability to use AWS secrets
    // if configured with AWS permissions
    const stsClient = new STSClient({});

    try {
      // will fail unless we have valid AWS credentials
      const _identity = await stsClient.send(new GetCallerIdentityCommand({}));

      convictConfig.load(await getConfigAwsSecretsManager(true));
    } catch {
      // if we were not in AWS OR the secret doesn't load then plough on irrespective (this is local-mac!)
    }

    convictConfig.load(await getConfigLocalMac());
  }

  if (location === "aws") convictConfig.load(await getConfigAwsSecretsManager(false)); */

  // perform validation
  convictConfig.validate({ allowed: "strict" });

  return convictConfig;
}
