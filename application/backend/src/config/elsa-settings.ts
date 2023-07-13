import { Issuer } from "openid-client";
import { LoggerOptions } from "pino";
import { DacType } from "./config-schema-dac";
import { DatasetType } from "./config-schema-dataset";
import { SharerType } from "./config-schema-sharer";
import { EmailerType } from "./config-schema-emailer";
import { BrandingType } from "./config-schema-branding";
import { OidcType } from "./config-schema-oidc";
import { HttpHostingType } from "./config-schema-http-hosting";
import { FeatureType } from "./config-schema-feature";
import { DataEgressConfigType } from "./config-schema-data-egress";
import { DevTestingType } from "./config-schema-dev";

/**
 * The rich, well-typed settings for Elsa.
 * This should be removed and replaced with a passthrough of the Zod config types.
 */
export type ElsaSettings = {
  // the URL by which this instance is found - used for generating email links and OIDC redirects etc
  deployedUrl: string;

  // the namespace in which we should be doing service discovery for dynamic services
  serviceDiscoveryNamespace: string;

  // the settings for our web server (cookies, ports etc)
  httpHosting: HttpHostingType;

  oidc?: Omit<OidcType, "issuerUrl"> & { issuer?: Issuer };

  // selectively switch on/off functionality
  feature?: FeatureType;

  // Feature configurations
  dataEgressConfig?: DataEgressConfigType;

  // details that are required if running in AWS
  aws?: {
    tempBucket: string;
  };

  // optional signing details to allow sharing of objects in CloudFlare R2
  cloudflare?: {
    signingAccessKeyId: string;
    signingSecretAccessKey: string;
  };

  // Read the README.md for GCP-related configuration

  // the FHIR endpoint for an Ontoserver
  ontoFhirUrl: string;

  // prefix for releaseKey
  releaseKeyPrefix: string;

  // NOTE: https://confluence.hl7.org/display/TA/External+Terminologies+-+Information is a good reference for these
  mondoSystem: { uri: string; oid: string };
  hgncGenesSystem: { uri: string; oid: string };
  hpoSystem: { uri: string; nonPreferredUri: string };
  isoCountrySystemUri: string;
  snomedSystem: { uri: string; oid: string };

  superAdmins: {
    // the sub id from the upstream OIDC provider
    sub: string;
  }[];

  // dev/testing settings that can be specified as long as the NODE_ENV is development
  // if NODE_ENV is production then this the presence of any configuration leading to this
  // will fail to launch
  devTesting?: DevTestingType;

  // pass through directly from configuration - eventually we want to pass everything through
  // directly and essentially remove ElsaSettings as a type

  dacs: DacType[];

  logger: LoggerOptions;

  datasets: DatasetType[];

  sharers: SharerType[];

  emailer?: EmailerType;

  branding?: BrandingType & { logoUriRelative?: string };

  ipLookup?: {
    maxMindDbPath?: string;
  };
};
