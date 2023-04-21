import _ from "lodash";
import { z } from "zod";

const env_prefix = "ELSA_DATA_CONFIG_";

export const CONFIG_SOURCES_ENVIRONMENT_VAR = `ELSA_DATA_META_CONFIG_SOURCES`;
export const CONFIG_FOLDERS_ENVIRONMENT_VAR = `ELSA_DATA_META_CONFIG_FOLDERS`;

export const loggerTransportTargetsArray = {
  name: "logger-transport-array",
  validate: (items: any[], schema: any) => {
    if (!Array.isArray(items)) {
      throw new Error("Must be of type Array");
    }

    for (const child of items) {
      const errorMsg =
        "Each logger transport must have a string field called target";
      if (!("target" in child)) throw new Error(errorMsg);
      if (!_.isString(child["target"])) throw new Error(errorMsg);

      // TODO: any other validation?
      // we really want to just pass through options to Pino so we don't really need any checking ourselves?
    }
  },
};

type Sensitive = "Sensitive";

export const configZodDefinition = z.object({
  edgeDb: z.optional(
    z.object({
      tlsRootCa: z
        .string()
        .describe(
          "A single line string (use \\n for breaks) of TLS Root CA used by the TLS of the EdgeDb"
        )
        .brand<Sensitive>(),
    })
  ),
  oidc: z.optional(
    z.object({
      issuerUrl: z.string().describe("The URL of the OIDC issuer for authn"),
      clientId: z
        .string()
        .describe("The client id registered with the OIDC issuer"),
      clientSecret: z
        .string()
        .describe("The client secret of the OIDC issuer")
        .brand<Sensitive>(),
    })
  ),
  session: z.optional(
    z.object({
      secret: z
        .string()
        .describe(
          "A long string secret that is used as part of the session encryption"
        )
        .brand<Sensitive>(),
      salt: z
        .string()
        .length(16)
        .describe(
          "A 16 character salt that is used as part of the session encryption"
        )
        .brand<Sensitive>(),
    })
  ),
  htsget: z.optional(
    z.object({
      url: z.optional(z.string()),
    })
  ),
  aws: z.optional(
    z.object({
      signingAccessKeyId: z
        .optional(z.string())
        .describe(
          "An AWS access key id for a user with read permission of files that can be shared via S3 signed URLs"
        )
        .brand<Sensitive>(),
      signingSecretAccessKey: z
        .optional(z.string())
        .describe(
          "An AWS secret access key for a user with read permission of files that can be shared via S3 signed URLs"
        )
        .brand<Sensitive>(),
      tempBucket: z
        .optional(z.string())
        .describe(
          "A bucket that can be used for storing temporary artifacts - can have a Lifecycle that removes files after a day"
        ),
    })
  ),
  cloudflare: z.optional(
    z.object({
      signingAccessKeyId: z
        .string()
        .describe(
          "A CloudFlare R2 access key id for a user with read permission of files that can be shared via signed URLs"
        )
        .brand<Sensitive>(),
      signingSecretAccessKey: z
        .string()
        .describe(
          "A CloudFlare R2 secret access key for a user with read permission of files that can be shared via signed URLs"
        )
        .brand<Sensitive>(),
    })
  ),
  rateLimit: z.optional(
    z.object({
      allowList: z.optional(z.array(z.string())),
      max: z.optional(z.string()),
      timeWindow: z.optional(z.string()),
    })
  ),
  ontoFhirUrl: z.optional(z.string()),
  deployUrl: z
    .string()
    .describe(
      "The externally accessible Url for the deployed location of Elsa Data"
    ),
  port: z.optional(z.coerce.number().positive().int()).default(3000),
  datasets: z.array(z.any()).default([]),
  superAdmins: z.array(z.any()).default([]),
});

export type ElsaConfiguration = z.infer<typeof configZodDefinition>;

export const configDefinition = {
  htsget: {
    maxAge: {
      doc: "The amount of time that a htsget manifest remains valid in seconds",
      format: "Number",
      sensitive: false,
      default: "86400",
      nullable: false,
      env: `${env_prefix}HTSGET_MANIFEST_TTL`,
    },
    url: {
      doc: "The url for the htsget endpoint",
      format: String,
      sensitive: false,
      default: null,
      nullable: true,
      env: `${env_prefix}HTSGET_URL`,
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
  maxmindDbAssetPath: {
    doc: "The path where maxmind city database live.",
    format: "*",
    default: "asset/maxmind/db/",
  },
  releaseKeyPrefix: {
    doc: "The prefix appended on the releaseKey before the count number.",
    format: "*",
    default: "R",
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
  mailer: {
    mode: {
      doc:
        'Set the mode of the mail server, either "None", "SES" or "SMTP".' +
        '"None" will not start the mail server, "SES" will use the SES api directly, and ' +
        '"SMTP" will configure the server manually using the options below.',
      format: function check(value: string): value is "None" | "SES" | "SMTP" {
        return value === "None" || value === "SES" || value === "SMTP";
      },
      nullable: false,
      default: "None",
      env: `${env_prefix}MAILER_MODE`,
      arg: "mailer-mode",
    },
    maxConnections: {
      doc: "Optional max connections to use with SES.",
      format: "nat",
      nullable: true,
      default: null,
      env: `${env_prefix}MAILER_SES_MAX_CONNECTIONS`,
      arg: "mailer-ses-max-connections",
    },
    sendingRate: {
      doc: "Optional number of messages to send when using SES.",
      format: "nat",
      nullable: true,
      default: null,
      env: `${env_prefix}MAILER_SES_SENDING_RATE`,
      arg: "mailer-ses-sending-rate",
    },
    options: {
      doc:
        'Set this when using the "SMTP" mode to manually configuring the SMTP server. ' +
        "These are passed to the nodemailer createTransport function using the options property: " +
        "https://nodemailer.com/smtp/#general-options",
      format: "Object",
      nullable: true,
      default: {},
      env: `${env_prefix}MAILER_OPTIONS`,
      arg: "mailer-options",
    },
    defaults: {
      doc:
        "Set defaults that get merged into every message object. " +
        "These are passed directly to the nodemailer createTransport.",
      format: "Object",
      nullable: true,
      default: null,
      env: `${env_prefix}MAILER_DEFAULTS`,
      arg: "mailer-defaults",
    },
  },
  logger: {
    level: {
      doc: "The logging level as per Pino (all the standard level strings + silent)",
      format: String,
      default: "info",
      nullable: false,
      env: `${env_prefix}LOGGER_LEVEL`,
    },
    transportTargets: {
      doc: "An array of Pino logger transport targets configurations",
      format: "logger-transport-array",
      default: [],
      nullable: false,
    },
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
      sub: {
        doc: "The subject id of the user that should be given super admin permissions",
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
