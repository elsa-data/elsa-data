import convict from "convict";
import { ElsaEnvironment, ElsaLocation } from "./elsa-settings";
import { getConfigLocalMac } from "./config-local-mac";
import { getConfigAwsSecretsManager } from "./config-aws-secrets-manager";

convict.addParser({ extension: "json5", parse: require("json5").parse });

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
  const config = convict(
    {
      /*env: {
        doc: "The application environment.",
        format: ["production", "development", "test"],
        default: "development",
        env: "NODE_ENV",
      }, */
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
        },
        salt: {
          doc: "A 16 character salt that is used as part of the session encryption",
          format: "*",
          sensitive: true,
          default: null,
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
        env: "PORT",
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
    },
    {}
  );

  // first step is to identify the environment and load that
  //const env = config.get("env");

  config.loadFile([
    `./config/location-${location}.json5`,
    `./config/environment-${environment}.json5`,
    "./config/base.json5",
  ]);

  if (location === "local-mac") config.load(await getConfigLocalMac());
  if (location === "aws") config.load(await getConfigAwsSecretsManager());

  // perform validation
  config.validate({ allowed: "strict" });

  return config;
}
