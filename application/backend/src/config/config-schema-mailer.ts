import { z } from "zod";

const MailerSES = z.object({
  mode: z.literal("SES"),
  maxConnections: z
    .optional(z.number().positive().int())
    .describe("Optional max connections to use with SES"),
  sendingRate: z
    .optional(z.number().positive().int())
    .describe("Optional number of messages to send when using SES"),
  defaults: z
    .optional(z.any())
    .describe(
      "Set defaults that get merged into every message object. " +
        "These are passed directly to the nodemailer createTransport."
    ),
});

const MailerSMTP = z.object({
  mode: z.literal("SMTP"),
  options: z
    .any()
    .describe(
      "These are passed to the nodemailer createTransport function using the options property: " +
        "https://nodemailer.com/smtp/#general-options"
    ),
  defaults: z
    .optional(z.any())
    .describe(
      "Set defaults that get merged into every message object. " +
        "These are passed directly to the nodemailer createTransport."
    ),
});

export const MailerSchema = z.discriminatedUnion("mode", [
  MailerSES,
  MailerSMTP,
]);

export type MailerType = z.infer<typeof MailerSchema>;
