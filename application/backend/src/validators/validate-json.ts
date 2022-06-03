import addFormats from "ajv-formats";
import Ajv from "ajv/dist/2019";
import {
  DatasetGen3SyncRequestSchema,
  DatasetGen3SyncRequestType,
  TestingRequestSchema,
  TestingRequestType,
} from "@umccr/elsa-types";

const ajv = addFormats(new Ajv({ allErrors: true }), [
  "date-time",
  "time",
  "date",
  "email",
  "hostname",
  "ipv4",
  "ipv6",
  "uri",
  "uri-reference",
  "uuid",
  "uri-template",
  "json-pointer",
  "relative-json-pointer",
  "regex",
])
  .addKeyword("kind")
  .addKeyword("modifier");

export const datasetGen3SyncRequestValidate =
  ajv.compile<DatasetGen3SyncRequestType>(DatasetGen3SyncRequestSchema);

export const testingRequestValidate =
  ajv.compile<TestingRequestType>(TestingRequestSchema);
