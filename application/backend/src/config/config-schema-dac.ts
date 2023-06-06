import { z } from "zod";
import { Sensitive } from "./config-schema-sensitive";

// NOTE
// unlike most of our configuration schemas - data in this format is passed almost verbatim
// to the frontend via some API calls
// changes here CAN have an effect on the front end

export const DacRemsSchema = z.object({
  id: z.string(),
  type: z.literal("rems"),
  description: z.string(),
  // the URL of the REMS server
  url: z.string(),
  // the user id of the bot user who will connect to the REMS API
  botUser: z.string(),
  // the key of the bot user who will connect to the REMS API
  botKey: z.string().brand<Sensitive>(),
});

export const DacRedcapAustralianGenomicsCsvSchema = z.object({
  id: z.string(),
  type: z.literal("redcap-australian-genomics-csv"),
  description: z.string(),
});

export const DacRedcapAustralianGenomicsDemoCsvSchema = z.object({
  id: z.string(),
  type: z.literal("redcap-australian-genomics-demo-csv"),
  description: z.string(),
});

export const DacManualSchema = z.object({
  id: z.literal("manual"),
  type: z.literal("manual"),
  description: z.string(),
});

export const DacSchema = z.discriminatedUnion("type", [
  DacRemsSchema,
  DacRedcapAustralianGenomicsCsvSchema,
  DacRedcapAustralianGenomicsDemoCsvSchema,
  DacManualSchema,
]);

export type DacType = z.infer<typeof DacSchema>;
