import { Issuer } from "openid-client";
import type { LoggerOptions } from "pino";
import type { BrandingType } from "./config-schema-branding";
import type { ConsenterType } from "./config-schema-consenter";
import type { DacType } from "./config-schema-dac";
import type { DataEgressConfigType } from "./config-schema-data-egress";
import type { DatasetType } from "./config-schema-dataset";
import type { DevTestingType } from "./config-schema-dev";
import type { EmailerType } from "./config-schema-emailer";
import type { FeatureType } from "./config-schema-feature";
import type { HttpHostingType } from "./config-schema-http-hosting";
import type { OidcType } from "./config-schema-oidc";
import type { PermissionType } from "./config-schema-permission";
import type { SharerType } from "./config-schema-sharer";

/**
 * The rich, well-typed settings for Elsa.
 * This should be removed and replaced with a passthrough of the Zod config types.
 */
export type ElsaSettings = {
  // the URL by which this instance is found - used for generating email links and OIDC redirects etc
  deployedUrl: string;

  // if deployed to AWS - the region and account the stack is running in
  // many services need to know our deployed region/account in order to make sensible decisions about
  // data egress etc
  // NOTE that these are derived automatically and cannot be set in configuration
  deployedAwsRegion?: string;
  deployedAwsAccount?: string;

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
    vpcId: string;
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

  consenters: ConsenterType[];

  emailer?: EmailerType;

  branding?: BrandingType & { logoUriRelative?: string };

  permission?: PermissionType;

  ipLookup?: {
    maxMindDbPath?: string;
  };
};
