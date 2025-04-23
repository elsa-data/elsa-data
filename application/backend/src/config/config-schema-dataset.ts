import { z } from "zod";
import { oneOf } from "./zod-typescript-helpers";

export const DatasetAustralianGenomicsDirectoriesSchema = z.object({
  uri: z
    .string()
    .describe(
      "A globally unique URI representing the identifier for the dataset",
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
      "The storage URI prefix leading to data and manifests. e.g. 's3://agha-gdr-store-2.0/Cardiac/'",
    ),
  // possible change this to be a regex and that opens up more flexible mechanisms of identifying manifests?
  manifestEndsWith: z
    .string()
    .describe(
      "Define the (ending) of the path of the manifest accompanying each folder of genomic objects",
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
            "If present a regex capture group that will state the case identifier from the object path",
          ),
        manifestColumnName: z
          .string()
          .optional()
          .describe(
            "If present the name of the column in the manifest that holds the case identifier",
          ),
      })
      .superRefine(oneOf("pathRegex", "manifestColumnName")),
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
            "If present a regex capture group that will state the specimen identifier from the object path",
          ),
        manifestColumnName: z
          .string()
          .optional()
          .describe(
            "If present the name of the column in the manifest that holds the specimen identifier",
          ),
      })
      .superRefine(oneOf("pathRegex", "manifestColumnName")),
  ),
  pedigree: z.optional(
    z
      .object({
        usePatientIdentifierSuffixes: z
          .boolean()
          .describe(
            "Attempt to build pedigree relationships using patient identifier suffixes (_pat, _mat etc)",
          ),
      })
      .describe("If present, configures the mechanism for building pedigrees"),
  ),
  aws: z.optional(
    z.object({
      eventDataStoreId: z
        .string()
        .describe(
          "An AWS CloudTrail lake client data store Id for tracking data egress. E.g. '327383f8-3273-3273-3273-327383f8fc43'",
        ),
    }),
  ),
});

/**
 *
 */
export const DatasetPhenopacketFirstSchema = z.object({
  uri: z
    .string()
    .describe(
      "A globally unique URI representing the identifier for the dataset",
    ),
  name: z.string().describe("Friendly name of the dataset"),
  description: z.string().describe("A brief description of the dataset"),
  loader: z
    .literal("pfdl")
    .describe(
      "A loader that loads from Phenopacket first structured directories",
    ),
  rootUrls: z
    .array(z.string())
    .describe(
      "The root URLs making up this dataset. e.g. ['s3://agha-gdr-store-2.0/Cardiac/']",
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
      "A globally unique URI representing the identifier for the dataset",
    ),
  name: z.string().describe("Friendly name of the dataset"),
  description: z.string().describe("A brief description of the dataset"),
  loader: z.literal("dev"),
});

export const DatasetSchema = z.discriminatedUnion("loader", [
  DatasetAustralianGenomicsDirectoriesSchema,
  DatasetPhenopacketFirstSchema,
  DatasetDevSchema,
]);

export type DatasetType = z.infer<typeof DatasetSchema>;

export type DatasetAustralianGenomicsDirectories = z.infer<
  typeof DatasetAustralianGenomicsDirectoriesSchema
>;

export type DatasetAustralianGenomicsDirectoriesInput = z.input<
  typeof DatasetAustralianGenomicsDirectoriesSchema
>;

export type DatasetPhenopacketFirst = z.infer<
  typeof DatasetPhenopacketFirstSchema
>;

export type DatasetPhenopacketFirstInput = z.input<
  typeof DatasetPhenopacketFirstSchema
>;
