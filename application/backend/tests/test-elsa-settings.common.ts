import { ElsaSettings } from "../src/config/elsa-settings";
import { Issuer } from "openid-client";
import { TEST_SUBJECT_3 } from "../src/test-data/user/insert-user3";
import { SMARTIE_URI } from "../src/test-data/dataset/insert-test-data-smartie";
import { BRAND } from "zod";
import { BrandingType } from "../src/config/config-schema-branding";
import { Sensitive } from "../src/config/config-schema-sensitive";

export const TENG_AWS_EVENT_DATA_STORE_ID = "10g-event-data-store-id";

// even though our elsa settings are a factory - we don't want to have to do this work every
// time as it has to go to the internet and discover the CIlogon OIDC settings
const ciLogonIssuer = new Issuer({
  issuer: "https://cilogon.org",
});

/**
 * A settings object that is suitable for use throughout our test
 * suite.
 */
export const createTestElsaSettings: () => ElsaSettings = () => ({
  // TODO these settings have just been thrown in - and may need to be refined as testing gets
  //      more sophisticated
  deployedUrl: "http://localhost:3000",
  serviceDiscoveryNamespace: "elsa-data",
  httpHosting: {
    port: 3000,
    host: "127.0.0.1",
    session: {
      salt: "0123456789012345" as any, // pragma: allowlist secret
      secret: "XYZ Is the Text That is A certain length" as any, // pragma: allowlist secret
    },
  },
  mailer: undefined,
  sharers: [
    {
      id: "htsget-umccr",
      type: "htsget",
      maxAgeInSeconds: 86400,
      url: "https://htsget.elsa.dev.umccr.org",
    },
  ],
  dacs: [
    {
      id: "manual",
      type: "manual",
      description: "Manual",
    },
  ],
  datasets: [
    {
      name: "10G",
      description: "UMCCR 10G",
      uri: "urn:fdc:umccr.org:2022:dataset/10g",
      loader: "australian-genomics-directories",
      storageLocation: "aws-s3",
      storageUriPrefix: "s3://umccr-10g-data-dev",
      aws: {
        eventDataStoreId: TENG_AWS_EVENT_DATA_STORE_ID,
      },
    },
    {
      name: "10F",
      description: "UMCCR 10F",
      uri: "urn:fdc:umccr.org:2022:dataset/10f",
      loader: "australian-genomics-directories",
      storageLocation: "aws-s3",
      storageUriPrefix: "s3://umccr-10f-data-dev",
    },
    {
      name: "10C",
      description: "UMCCR 10C",
      uri: "urn:fdc:umccr.org:2022:dataset/10c",
      loader: "australian-genomics-directories",
      storageLocation: "aws-s3",
      storageUriPrefix: "s3://umccr-10c-data-dev",
    },
    {
      uri: SMARTIE_URI,
      name: "UMCCR MM",
      description: "A mini mitochondrial",
      loader: "australian-genomics-directories",
      storageLocation: "aws-s3",
      storageUriPrefix: "s3://elsa-data-test-datasets/MM",
    },
  ],
  superAdmins: [
    {
      sub: TEST_SUBJECT_3,
    },
  ],
  logger: {
    level: "trace",
    transport: {
      targets: [
        {
          target: "pino-pretty",
          level: "trace",
          options: {},
        },
      ],
    },
  },
  oidc: {
    issuer: ciLogonIssuer,
    clientId: "12345",
    clientSecret: "abcd" as any, // pragma: allowlist secret
  },
  ontoFhirUrl: "https://onto.example.com/fhir",
  mondoSystem: {
    uri: "",
    oid: "",
  },
  hgncGenesSystem: {
    uri: "",
    oid: "",
  },
  hpoSystem: {
    uri: "",
    nonPreferredUri: "",
  },
  isoCountrySystemUri: "",
  snomedSystem: {
    uri: "",
    oid: "",
  },
  ipLookup: { maxMindDbPath: "config/GeoLite2-City.mmdb" },
  aws: {
    signingSecretAccessKey: "A", // pragma: allowlist secret
    signingAccessKeyId: "B", // pragma: allowlist secret
    tempBucket: "a-temp-bucket",
  },
  devTesting: {
    sourceFrontEndDirect: false,
    allowTestRoutes: true,
    allowTestUsers: true,
  },
  releaseKeyPrefix: "R",
});
