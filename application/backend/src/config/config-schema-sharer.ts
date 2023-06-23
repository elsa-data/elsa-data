import { z } from "zod";

export const SharerObjectSigningSchema = z.object({
  id: z.string(),
  type: z.literal("object-signing"),
  // the number of seconds to make the object signing URL valid for
  maxAgeInSeconds: z
    .number()
    .int()
    .describe(
      "The amount of time that a signed object link should remain valid in seconds"
    ),
});

export const SharerCopyOutSchema = z.object({
  id: z.string(),
  type: z.literal("copy-out"),
});

export const SharerHtsgetSchema = z.object({
  id: z.string(),
  type: z.literal("htsget"),
  maxAgeInSeconds: z
    .number()
    .int()
    .describe(
      "The amount of time that a htsget manifest remains valid in seconds"
    ),
  url: z.string().describe("The URL for the htsget endpoint"),
});

export const SharerAwsAccessPointSchema = z.object({
  id: z.string(),
  type: z.literal("aws-access-point"),
  allowedVpcs: z
    .record(z.string().startsWith("vpc-"))
    .describe("A dictionary of VPC descriptions and their AWS ids"),
});

export const SharerSchema = z.discriminatedUnion("type", [
  SharerObjectSigningSchema,
  SharerCopyOutSchema,
  SharerHtsgetSchema,
  SharerAwsAccessPointSchema,
]);

export type SharerType = z.infer<typeof SharerSchema>;

export type SharerObjectSigningType = z.infer<typeof SharerObjectSigningSchema>;
export type SharerCopyOutType = z.infer<typeof SharerCopyOutSchema>;
export type SharerHtsgetType = z.infer<typeof SharerHtsgetSchema>;
