import { z } from "zod";
import { Sensitive } from "./config-schema-sensitive";

/**
 * The master schema definition for our configuration objects (i.e. JSON).
 */
export const OidcSchema = z.object({
  issuerUrl: z.string().describe("The URL of the OIDC issuer for authn"),
  clientId: z
    .string()
    .describe("The client id registered with the OIDC issuer"),
  clientSecret: z
    .string()
    .describe("The client secret of the OIDC issuer")
    .brand<Sensitive>(),
});

export type OidcType = z.infer<typeof OidcSchema>;
