import { z } from "zod";

/**
 * A configuration for selectively choosing features to enable in any
 * particular instance.
 */
export const FeatureSchema = z.object({
  enableConsentDisplay: z
    .optional(z.boolean())
    .describe(
      "Whether the UI display of consent information in Elsa Data should be enabled"
    ),
  enableCohortConstructor: z
    .optional(z.boolean())
    .describe(
      "Whether the cohort constructor features of Elsa Data should be enabled"
    ),
  enableDataEgressViewer: z
    .optional(z.boolean())
    .describe(
      "Whether the data egress viewer features of Elsa Data should be enabled"
    ),
});

export type FeatureType = z.infer<typeof FeatureSchema>;
