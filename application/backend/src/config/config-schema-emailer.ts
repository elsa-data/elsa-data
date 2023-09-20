import { z } from "zod";

const EmailerCommon = {
  from: z
    .object({
      name: z.string().describe("The display name of the from address."),
      address: z.string().describe("The from email address."),
    })
    .required()
    .describe(
      "Defines the email address and display name that Elsa uses to send emails.",
    ),
  templateRootPath: z
    .optional(z.string())
    .describe(
      "The path to the root folder locating the tree of email templates. If left undefined this will resolve to an 'emails' folder in the current directory.",
    ),
  sendEmails: z
    .optional(z.boolean())
    .describe(
      "Whether emails should actually be sent or if they are just built and rendered locally. If undefined, sends emails if NODE_ENV is not development.",
    ),
  previewEmails: z
    .optional(z.boolean())
    .describe(
      "Whether emails should be previewed. If undefined, previews emails if NODE_ENV is development.",
    ),
  templateDictionary: z
    .record(z.string())
    .default({})
    .describe(
      "A dictionary of template values that will be replaced in the pug email templates. This will override" +
        "the default values passed to locals object in the email template, or add new values if the different templates are used.",
    ),
  defaults: z
    .optional(z.any())
    .describe(
      "Set defaults that get merged into every message object. " +
        "These are passed directly to the nodemailer createTransport.",
    ),
};

const EmailerSES = z.object({
  mode: z.literal("SES"),
  maxConnections: z
    .optional(z.number().positive().int())
    .describe("Optional max connections to use with SES"),
  sendingRate: z
    .optional(z.number().positive().int())
    .describe("Optional number of messages to send when using SES"),
  ...EmailerCommon,
});

const EmailerSMTP = z.object({
  mode: z.literal("SMTP"),
  options: z
    .any()
    .describe(
      "These are passed to the nodemailer createTransport function using the options property: " +
        "https://nodemailer.com/smtp/#general-options",
    ),
  ...EmailerCommon,
});

export const EmailerSchema = z.discriminatedUnion("mode", [
  EmailerSES,
  EmailerSMTP,
]);

export type EmailerType = z.infer<typeof EmailerSchema>;
