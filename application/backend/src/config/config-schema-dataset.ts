import { z } from "zod";
import { Sensitive } from "./config-schema-sensitive";

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
  specimenIdentifierRegex: z.optional(
    z
      .string()
      .describe(
        "If present a regex capture group that will state the case identifier from a given filename"
      )
  ),
  caseIdentifierRegex: z.optional(
    z
      .string()
      .describe(
        "If present a regex capture group that will state the specimen identifier from a given filename"
      )
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

export const DatasetSchema = z.discriminatedUnion("loader", [
  DatasetAustralianGenomicsDirectoriesSchema,
  DatasetAustralianGenomicsDirectoriesDemoSchema,
]);

export type DatasetType = z.infer<typeof DatasetSchema>;
