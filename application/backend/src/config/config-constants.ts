import { z } from "zod";
import { Sensitive } from "./config-schema-sensitive";
import { DacSchema } from "./config-schema-dac";
import { DatasetSchema } from "./config-schema-dataset";

export const CONFIG_SOURCES_ENVIRONMENT_VAR = `ELSA_DATA_META_CONFIG_SOURCES`;
export const CONFIG_FOLDERS_ENVIRONMENT_VAR = `ELSA_DATA_META_CONFIG_FOLDERS`;
export const MAXMIND_SOURCE_ENVIRONMENT_VAR = `ELSA_DATA_META_MAXMIND_DB_SOURCE`;

const MailerSES = z.object({
  mode: z.literal("SES"),
  maxConnections: z
    .optional(z.number().positive().int())
    .describe("Optional max connections to use with SES"),
  sendingRate: z
    .optional(z.number().positive().int())
    .describe("Optional number of messages to send when using SES"),
  defaults: z
    .optional(z.any())
    .describe(
      "Set defaults that get merged into every message object. " +
        "These are passed directly to the nodemailer createTransport."
    ),
});

const MailerSMTP = z.object({
  mode: z.literal("SMTP"),
  options: z
    .any()
    .describe(
      "These are passed to the nodemailer createTransport function using the options property: " +
        "https://nodemailer.com/smtp/#general-options"
    ),
  defaults: z
    .optional(z.any())
    .describe(
      "Set defaults that get merged into every message object. " +
        "These are passed directly to the nodemailer createTransport."
    ),
});

/**
 * The master schema definition for our configuration objects (i.e. JSON).
 */
export const configZodDefinition = z.object({
  edgeDb: z.optional(
    z.object({
      tlsRootCa: z
        .string()
        .startsWith("-----BEGIN")
        .describe(
          "A single line string (use \\n for breaks) of TLS Root CA used by the TLS of the EdgeDb"
        )
        .brand<Sensitive>(),
    })
  ),
  serviceDiscoveryNamespace: z
    .optional(z.string())
    .describe(
      "The name of the root artifact used for dynamic service discovery - this will differ for each deployment environment. For AWS - it refers to a CloudMap namespace"
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
      maxAge: z
        .optional(z.number().int())
        .describe(
          "The amount of time that a htsget manifest remains valid in seconds"
        ),
      url: z.optional(z.string()).describe("The url for the htsget endpoint"),
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
  // the rate limiting options are basically a pass through to the Fastify rate limit plugin
  // for the moment we have picked only a subset of the full configuration items
  rateLimit: z.optional(
    z.object({
      allowList: z
        .optional(z.array(z.string()))
        .describe(
          "The IP addresses of any clients allowed to bypass rate limiting"
        ),
      max: z
        .optional(z.number().int())
        .describe(
          "The maximum number of API calls allowed from a single IP in the time window"
        ),
      timeWindow: z
        .optional(z.number().int())
        .describe(
          "The number of milliseconds in the time window in which rate limit events are measured"
        ),
    })
  ),
  logger: z
    .object({
      level: z
        .string()
        .describe(
          "The logging level as per Pino (all the standard level strings + silent)"
        )
        .default("debug"),
      transportTargets: z
        .array(
          z
            .object({
              target: z.string(),
            })
            .passthrough()
        )
        .describe("An array of Pino logger transport targets configurations")
        .default([]),
    })
    .default({
      level: "debug",
      transportTargets: [],
    }),
  ontoFhirUrl: z.optional(z.string()),
  // all production deployments will require this to be set - though the logic for this check is elsewhere
  deployedUrl: z.optional(
    z
      .string()
      .describe(
        "The externally accessible Url for the deployed location of Elsa Data"
      )
  ),
  releaseKeyPrefix: z
    .string()
    .default("R")
    .describe("The prefix appended on the releaseKey before the count number"),
  host: z
    .string()
    .ip()
    .default("0.0.0.0")
    .describe("The host interface to bind to"),
  port: z.coerce
    .number()
    .positive()
    .int()
    .default(3000)
    .describe("The port to bind to"),
  datasets: z
    .array(DatasetSchema)
    .default([])
    .describe(
      "An array defining the datasets which are shareable from this instance"
    ),
  superAdmins: z
    .array(
      z.object({
        sub: z
          .string()
          .describe(
            "The subject id of the user that should be given super admin permissions"
          ),
      })
    )
    .default([])
    .describe(
      "A collection of users with super administration rights i.e. the ability to alter other user rights"
    ),
  dacs: z.array(DacSchema).default([
    {
      id: "manual",
      type: "manual",
      description: "Manual",
    },
  ]),
  // if present, a mailer is being configured and if not present, then the mailer does not start
  mailer: z.optional(z.discriminatedUnion("mode", [MailerSES, MailerSMTP])),
  devTesting: z.optional(
    z.object({
      allowTestUsers: z
        .boolean()
        .describe(
          "If test users should be allowed, including various techniques used to adjust user sessions"
        ),
      allowTestRoutes: z.boolean().describe("If test routes should be added"),
    })
  ),
  branding: z.optional(
    z.object({
      brandName: z
        .optional(z.string())
        .describe(
          "The name of the organisation running this instance of Elsa Data"
        ),
      logoPath: z
        .optional(z.string())
        .describe(
          "The path to the logo of the organisation running this instance of Elsa Data"
        ),
    })
  ),
});

export type ElsaConfiguration = z.infer<typeof configZodDefinition>;
