import { z } from "zod";

export const BrandingSchema = z.object({
  brandName: z
    .optional(z.string())
    .describe(
      "The name of the organisation running this instance of Elsa Data",
    ),
  logoPath: z
    .optional(z.string())
    .describe(
      "The path to the logo of the organisation running this instance of Elsa Data",
    ),
});

export type BrandingType = z.infer<typeof BrandingSchema>;
