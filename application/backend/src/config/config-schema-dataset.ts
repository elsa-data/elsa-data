import { RefinementCtx, z } from "zod";
import { Sensitive } from "./config-schema-sensitive";

function oneOf<
  A,
  K1 extends Extract<keyof A, string>,
  K2 extends Extract<keyof A, string>,
  R extends A &
    (
      | (Required<Pick<A, K1>> & { [P in K2]: undefined })
      | (Required<Pick<A, K2>> & { [P in K1]: undefined })
    )
>(key1: K1, key2: K2): (arg: A, ctx: RefinementCtx) => arg is R {
  return (arg, ctx): arg is R => {
    if ((arg[key1] === undefined) === (arg[key2] === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Either ${key1} or ${key2} must be filled, but not both`,
      });
      return false;
    }
    return true;
  };
}

export const DatasetAustralianGenomicsDirectoriesSchema = z.object({
  uri: z
    .string()
    .describe(
      "A globally unique URI representing the identifier for the dataset"
    ),
  name: z.string().describe("Friendly name of the dataset"),
  description: z.string().describe("A brief description of the dataset"),
  loader: z.literal("australian-genomics-directories"),
  storageLocation: z
    .string()
    .describe("The location where data are stored. Options: 'aws-s3'"),
  storageUriPrefix: z
    .string()
    .describe(
      "The storage URI prefix leading to data and manifests. e.g. 's3://agha-gdr-store-2.0/Cardiac/'"
    ),
  // possible change this to be a regex and that opens up more flexible mechanisms of identifying manifests?
  manifestEndsWith: z
    .string()
    .describe(
      "Define the (ending) of the path of the manifest accompanying each folder of genomic objects"
    )
    .optional()
    .default("manifest.txt"),
  caseIdentifier: z.optional(
    z
      .object({
        pathRegex: z
          .string()
          .optional()
          .describe(
            "If present a regex capture group that will state the case identifier from the object path"
          ),
        manifestColumnName: z
          .string()
          .optional()
          .describe(
            "If present the name of the column in the manifest that holds the case identifier"
          ),
      })
      .superRefine(oneOf("pathRegex", "manifestColumnName"))
  ),
  /*patientIdentifier: z.optional(
    z
      .object({
        pathRegex: z
          .string()
          .optional()
          .describe(
            "If present a regex capture group that will state the patient identifier from the object path",
          ),
        manifestColumnName: z
          .string()
          .optional()
          .describe(
            "If present the name of the column in the manifest that holds the patient identifier",
          ),
      })
      .superRefine(oneOf("pathRegex", "manifestColumnName")),
  ), */
  specimenIdentifier: z.optional(
    z
      .object({
        pathRegex: z
          .string()
          .optional()
          .describe(
            "If present a regex capture group that will state the specimen identifier from the object path"
          ),
        manifestColumnName: z
          .string()
          .optional()
          .describe(
            "If present the name of the column in the manifest that holds the specimen identifier"
          ),
      })
      .superRefine(oneOf("pathRegex", "manifestColumnName"))
  ),
  pedigree: z.optional(
    z
      .object({
        usePatientIdentifierSuffixes: z
          .boolean()
          .describe(
            "Attempt to build pedigree relationships using patient identifier suffixes (_pat, _mat etc)"
          ),
      })
      .describe("If present, configures the mechanism for building pedigrees")
  ),
  aws: z.optional(
    z.object({
      eventDataStoreId: z
        .string()
        .describe(
          "An AWS CloudTrail lake client data store Id for tracking data egress. E.g. '327383f8-3273-3273-3273-327383f8fc43'"
        ),
    })
  ),
});

export const DatasetAustralianGenomicsDirectoriesDemoSchema = z.object({
  uri: z
    .string()
    .describe(
      "A globally unique URI representing the identifier for the dataset"
    ),
  name: z.string().describe("Friendly name of the dataset"),
  description: z.string().describe("A brief description of the dataset"),
  loader: z
    .literal("australian-genomics-directories-demo")
    .describe(
      "A loader that simulates loads from Australian Genomics structured directories - but does not need any actual cloud infrastructure"
    ),
  demonstrationStoragePrefix: z
    .string()
    .describe(
      "The storage path prefix where objects would exist for this demonstration - though their actual existence is entirely optional. e.g. 's3://a-bucket/10g/'"
    ),
  demonstrationSpecimenIdentifierRegex: z.optional(
    z
      .string()
      .describe(
        "If present a regex capture group that will state the specimen identifier from a given filename"
      )
  ),
  demonstrationCaseIdentifierRegex: z.optional(
    z
      .string()
      .describe(
        "If present a regex capture group that will state the case identifier from a given filename"
      )
  ),
});

/**
 * A dataset whose loader is baked into the source code. These are not general
 * purpose loaders and are only for use in development.
 */
export const DatasetDevSchema = z.object({
  uri: z
    .string()
    .describe(
      "A globally unique URI representing the identifier for the dataset"
    ),
  name: z.string().describe("Friendly name of the dataset"),
  description: z.string().describe("A brief description of the dataset"),
  loader: z.literal("dev"),
});

export const DatasetSchema = z.discriminatedUnion("loader", [
  DatasetAustralianGenomicsDirectoriesSchema,
  DatasetAustralianGenomicsDirectoriesDemoSchema,
  DatasetDevSchema,
]);

export type DatasetType = z.infer<typeof DatasetSchema>;

export type DatasetAustralianGenomicsDirectories = z.infer<
  typeof DatasetAustralianGenomicsDirectoriesSchema
>;

export type DatasetAustralianGenomicsDirectoriesInput = z.input<
  typeof DatasetAustralianGenomicsDirectoriesSchema
>;
