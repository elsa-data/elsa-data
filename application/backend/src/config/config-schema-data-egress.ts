import { z } from "zod";

/**
 * A configuration for selectively choosing features to enable in any
 * particular instance.
 */
export const DataEgressConfigSchema = z.object({
  updateInterval: z
    .optional(z.string())
    .describe(
      "If specified, a cron expression on when the system will need to auto-update the data egress records.",
    ),
});

export type DataEgressConfigType = z.infer<typeof DataEgressConfigSchema>;
