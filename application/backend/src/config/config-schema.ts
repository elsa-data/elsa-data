import convict from "convict";

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

export async function getConfig(otherConfigs: any[]) {
  // setup our configuration schema
  const config = convict(
    {
      env: {
        doc: "The application environment.",
        format: ["production", "development", "test"],
        default: "development",
        env: "NODE_ENV",
      },
      //location: {
      //  doc: " THe location the application is being run",
      //  format: ["mac-local", "aws"],
      //},
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
  const env = config.get("env");

  // TODO: establish a "location" and bring in a location config as well (local-mac v aws dev v aws prod etc)

  config.loadFile([`./config/environment-${env}.json5`, "./config/base.json5"]);

  if (otherConfigs) {
    for (const oc of otherConfigs) config.load(oc);
  }

  // perform validation
  config.validate({ allowed: "strict" });

  return config;
}
