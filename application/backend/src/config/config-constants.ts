const env_prefix = "ELSA_DATA_CONFIG_";

export const CONFIG_SOURCES_ENVIRONMENT_VAR = `ELSA_DATA_META_CONFIG_SOURCES`;
// export const CONFIG_FOLDERS_ENVIRONMENT_VAR = `ELSA_DATA_META_CONFIG_FOLDERS`;

export const configDefinition = {
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
  deployedUrl: {
    doc: "The externally accessible Url for the deployed location of Elsa Data",
    format: "*",
    default: undefined,
  },
  superAdmins: {
    doc: "A collection of users with super administration rights i.e. the ability to alter other user rights",
    format: "user-array",
    default: [],

    children: {
      id: {
        doc: "The user subject id",
        format: "*",
        default: undefined,
      },
      email: {
        doc: "The user email",
        format: "*",
        default: undefined,
      },
    },
  },
  devTesting: {
    allowTestUsers: {
      doc: "If test users should be allowed, including various techniques used to adjust user sessions",
      format: "*",
      sensitive: false,
      default: undefined,
    },
    allowTestRoutes: {
      doc: "If test routes should be added",
      format: "*",
      sensitive: false,
      default: undefined,
    },
  },
};
