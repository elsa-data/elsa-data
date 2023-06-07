import { z } from "zod";
import { Sensitive } from "./config-schema-sensitive";
import { DacSchema } from "./config-schema-dac";
import { DatasetSchema } from "./config-schema-dataset";
import { SharerSchema } from "./config-schema-sharer";
import { MailerSchema } from "./config-schema-mailer";
import { BrandingSchema } from "./config-schema-branding";
import { OidcSchema } from "./config-schema-oidc";

/**
 * Schema for http hosting settings (i.e settings for our web server).
 */
export const HttpHostingSchema = z.object({
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
  session: z.object({
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
  }),
  // the rate limiting options are basically a pass through to the Fastify rate limit plugin
  // for the moment we have picked only a subset of the full configuration items
  rateLimit: z.optional(
    z.object({
      // for the moment we set up the rate limiting across the entire Elsa Data surface
      // (includes APIs and HTML/CSS fetches etc)
      global: z.boolean().default(true),
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
});

export type HttpHostingType = z.infer<typeof HttpHostingSchema>;
