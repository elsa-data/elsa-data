const env_prefix = "ELSA_DATA_CONFIG_";

export const CONFIG_SOURCES_ENVIRONMENT_VAR = `ELSA_DATA_META_CONFIG_SOURCES`;
export const CONFIG_FOLDERS_ENVIRONMENT_VAR = `ELSA_DATA_META_CONFIG_FOLDERS`;

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
    tempBucket: {
      doc: "A bucket that can be used for storing temporary artifacts - can have a Lifecycle that removes files after a day",
      format: "*",
      sensitive: false,
      default: undefined,
      env: `${env_prefix}AWS_TEMP_BUCKET`,
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
  mondoSystem: {
    uri: {
      format: String,
      default: "http://purl.obolibrary.org/obo/mondo.owl",
    },
    oid: {
      format: String,
      default: "2.16.840.1.113883.3.9216",
    },
  },
  hgncGenesSystem: {
    uri: {
      format: String,
      default: "http://www.genenames.org",
    },
    oid: {
      format: String,
      default: "2.16.840.1.113883.6.281",
    },
  },
  hpoSystem: {
    uri: {
      format: String,
      default: "http://human-phenotype-ontology.org",
    },
    nonPreferredUri: {
      format: String,
      default: "http://purl.obolibrary.org/obo/hp.owl",
    },
  },
  isoCountrySystemUri: {
    format: String,
    default: "urn:iso:std:iso:3166",
  },
  snomedSystem: {
    uri: {
      format: String,
      default: "http://snomed.info/sct",
    },
    oid: {
      format: String,
      default: "2.16.840.1.113883.6.96",
    },
  },
  host: {
    doc: "The host to bind.",
    format: "*",
    default: "0.0.0.0",
    env: `${env_prefix}HOST`,
    arg: "host",
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
    env: `${env_prefix}DEPLOYED_URL`,
  },
  datasets: {
    doc: "A collection datasets configurations that will are registered in Elsa Data.",
    format: "array",
    default: [],
    children: {
      name: {
        doc: "Name of the dataset.",
        format: String,
        default: undefined,
      },
      uri: {
        doc: "A URI unique for the particular dataset.",
        format: String,
        default: undefined,
      },
      description: {
        doc: "A brief description of the dataset.",
        format: String,
        default: undefined,
      },
      storageLocation: {
        doc: "The location where data are stored. Options: 'aws-s3'",
        format: ["aws-s3"],
        default: "aws-s3",
      },
      storageUriPrefix: {
        doc: "The storage URI prefix leading to data and manifests. e.g. 's3://agha-gdr-store-2.0/Cardiac/'",
        format: "*",
        default: "",
      },
      aws: {
        eventDataStoreId: {
          doc: "An AWS CloudTrail lake client data store Id for tracking data egress. E.g. '327383f8-3273-3273-3273-327383f8fc43'",
          format: String,
          default: undefined,
        },
      },
    },
  },
  superAdmins: {
    doc: "A collection of users with super administration rights i.e. the ability to alter other user rights",
    format: "array",
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
