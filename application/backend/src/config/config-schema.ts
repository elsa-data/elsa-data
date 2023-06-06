import { z } from "zod";
import { Sensitive } from "./config-schema-sensitive";
import { DacSchema } from "./config-schema-dac";
import { DatasetSchema } from "./config-schema-dataset";
import { SharerSchema } from "./config-schema-sharer";
import { MailerSchema } from "./config-schema-mailer";
import { BrandingSchema } from "./config-schema-branding";
import { OidcSchema } from "./config-schema-oidc";

export const CONFIG_SOURCES_ENVIRONMENT_VAR = `ELSA_DATA_META_CONFIG_SOURCES`;
export const CONFIG_FOLDERS_ENVIRONMENT_VAR = `ELSA_DATA_META_CONFIG_FOLDERS`;

/**
 * The master schema definition for our configuration objects (i.e. JSON).
 */
export const configZodDefinition = z.object({
  serviceDiscoveryNamespace: z
    .optional(z.string())
    .default("elsa-data")
    .describe(
      "The name of the root artifact used for dynamic service discovery - this will differ for each deployment environment. For AWS - it refers to a CloudMap namespace"
    ),
  oidc: z.optional(OidcSchema),
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
  aws: z.optional(
    z.object({
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
  maxmindDbAssetPath: z
    .optional(z.string())
    .describe("The path to the Maxmind city database"),
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
  sharers: z
    .array(SharerSchema)
    .default([])
    .describe(
      "An array defining the sharing mechanisms which are to be enabled from this instance"
    ),
  // if present, a mailer is being configured and if not present, then the mailer does not start
  mailer: z.optional(MailerSchema),
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
  branding: z.optional(BrandingSchema),
});

export type ElsaConfigurationType = z.infer<typeof configZodDefinition>;
