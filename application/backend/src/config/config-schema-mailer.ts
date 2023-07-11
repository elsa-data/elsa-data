import { z } from "zod";

const MailerCommon = {
  from: z.optional(z.string()).default("no-reply").describe("What the `from` field will be when sending a system email."),
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
  ...MailerCommon
});

const MailerSMTP = z.object({
  mode: z.literal("SMTP"),
  options: z
    .any()
    .describe(
      "These are passed to the nodemailer createTransport function using the options property: " +
        "https://nodemailer.com/smtp/#general-options"
    ),
  ...MailerCommon
});

export const MailerSchema = z.discriminatedUnion("mode", [
  MailerSES,
  MailerSMTP,
]);

export type MailerType = z.infer<typeof MailerSchema>;
