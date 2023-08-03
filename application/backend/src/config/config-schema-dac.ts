import { z } from "zod";
import { Sensitive } from "./config-schema-sensitive";

const ID_DESCRIBE =
  "A locally unique id for referencing this DAC within the configuration of this Elsa Data";

const ID_REGEX = new RegExp(/^[a-zA-Z\-][a-zA-Z0-9_\-]{0,32}$/);
const ID_REGEX_MSG =
  "An identifier consisting only of letters/numbers/dashes/underscores";

const TYPE_DESCRIBE =
  "A fixed literal string that controls the type of DAC (one of 'rems', 'redcap-australian-genomics-csv', 'manual')";
const DESCRIPTION_DESCRIBE =
  "A human readable description of this DAC instance for the user interface";

// NOTE
// unlike most of our configuration schemas - data in this format is passed almost verbatim
// to the frontend via some API calls
// changes here CAN have an effect on the front end

export const DacRemsSchema = z.object({
  id: z.string().regex(ID_REGEX, ID_REGEX_MSG).describe(ID_DESCRIBE),
  type: z.literal("rems").describe(TYPE_DESCRIBE),
  description: z.string().describe(DESCRIPTION_DESCRIBE),
  // the URL of the REMS server
  url: z.string(),
  // the user id of the bot user who will connect to the REMS API
  botUser: z.string(),
  // the key of the bot user who will connect to the REMS API
  botKey: z.string().brand<Sensitive>(),
});

export type DacRemsType = z.infer<typeof DacRemsSchema>;

export const DacRedcapAustralianGenomicsCsvSchema = z.object({
  id: z.string().regex(ID_REGEX, ID_REGEX_MSG).describe(ID_DESCRIBE),
  type: z.literal("redcap-australian-genomics-csv").describe(TYPE_DESCRIBE),
  description: z.string().describe(DESCRIPTION_DESCRIBE),
  identifierSystem: z
    .string()
    .min(1)
    .describe(
      "The system URI used for creating the release identifier from this DAC - should be globally unique"
    ),
  identifierValueColumnHeader: z
    .string()
    .min(1)
    .describe(
      "The column header name of the column with an integer uniquely identifying each row - this will be fed as input into the release key printf"
    ),
  releaseKeyPrintf: z
    .string()
    .min(1)
    .describe(
      "A printf compatible string that is used for taking Redcap ids and converting into the release key (identifier value) - must have one %d"
    ),
  csvFlagshipDatasets: z
    .record(z.string().min(1), z.string().min(1))
    .describe("A map of CSV column header names to dataset URIs"),
});

export type DacRedcapAustralianGenomicsCsvType = z.infer<
  typeof DacRedcapAustralianGenomicsCsvSchema
>;

export const DacManualSchema = z.object({
  id: z.literal("manual").describe(ID_DESCRIBE),
  type: z.literal("manual").describe(TYPE_DESCRIBE),
  description: z.string().describe(DESCRIPTION_DESCRIBE),
});

export const DacSchema = z.discriminatedUnion("type", [
  DacRemsSchema,
  DacRedcapAustralianGenomicsCsvSchema,
  DacManualSchema,
]);

export type DacType = z.infer<typeof DacSchema>;
