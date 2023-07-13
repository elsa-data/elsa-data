import { z } from "zod";

const MailerCommon = {
  from: z
    .string()
    .describe(
      "Defines the email address that Elsa uses to send emails. Can be formatted with a display name" +
        'E.g. "Elsa Data" <no-reply@example.com>'
    ),
  templateDictionary: z
    .record(z.string())
    .describe(
      "A dictionary of template values that will be replaced in the pug email templates. This will override" +
        "the default values passed to locals object in the email template, or add new values if the different templates are used."
    ),
  defaults: z
    .optional(z.any())
    .describe(
      "Set defaults that get merged into every message object. " +
        "These are passed directly to the nodemailer createTransport."
    ),
};

const MailerSES = z.object({
  mode: z.literal("SES"),
  maxConnections: z
    .optional(z.number().positive().int())
    .describe("Optional max connections to use with SES"),
  sendingRate: z
    .optional(z.number().positive().int())
    .describe("Optional number of messages to send when using SES"),
  ...MailerCommon,
});

const MailerSMTP = z.object({
  mode: z.literal("SMTP"),
  options: z
    .any()
    .describe(
      "These are passed to the nodemailer createTransport function using the options property: " +
        "https://nodemailer.com/smtp/#general-options"
    ),
  ...MailerCommon,
});

export const MailerSchema = z.discriminatedUnion("mode", [
  MailerSES,
  MailerSMTP,
]);

export type MailerType = z.infer<typeof MailerSchema>;
