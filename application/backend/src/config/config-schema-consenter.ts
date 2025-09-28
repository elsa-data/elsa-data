import { z } from "zod";

const ID_DESCRIBE =
  "A locally unique id for referencing this consenter within the configuration of this Elsa Data";

const ID_REGEX = new RegExp(/^[a-zA-Z\-][a-zA-Z0-9_\-]{0,32}$/);
const ID_REGEX_MSG =
  "An identifier consisting only of letters/numbers/dashes/underscores";

const TYPE_DESCRIBE =
  "A fixed literal string that controls the type of consenter (one of 'ctrl')";
const DESCRIPTION_DESCRIBE =
  "A human readable description of this consenter instance for the user interface";

export const ConsenterCtrlSchema = z.object({
  id: z.string().regex(ID_REGEX, ID_REGEX_MSG).describe(ID_DESCRIBE),
  type: z.literal("ctrl").describe(TYPE_DESCRIBE),
  description: z.string().describe(DESCRIPTION_DESCRIBE),
  // the URL of the POSTable lookup API (full URI + path)
  url: z.string(),
  // the value of the HTTP authorization header to use when connecting
  authorizationHeaderValue: z.string(),
});

export type ConsenterCtrlType = z.infer<typeof ConsenterCtrlSchema>;

export const ConsenterSchema = z.discriminatedUnion("type", [
  ConsenterCtrlSchema,
]);

export type ConsenterType = z.infer<typeof ConsenterSchema>;
