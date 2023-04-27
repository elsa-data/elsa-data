import { Issuer } from "openid-client";
import { RateLimitPluginOptions } from "@fastify/rate-limit";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { LoggerOptions } from "pino";

/**
 * The rich, well-typed settings for Elsa.
 * This should be removed and replaced with a passthrough of the Zod config types.
 */
export type ElsaSettings = {
  // the URL by which this instance is found - used for generating email links and OIDC redirects etc
  deployedUrl: string;

  host: string;
  port: number;
  mailer: {
    mode: "None" | "SES" | "SMTP";
    maxConnections?: number | undefined;
    sendingRate?: number | undefined;
    options?: SMTPTransport.Options | string;
    defaults?: any;
  };

  // the namespace in which we should be doing service discovery for dynamic services
  serviceDiscoveryNamespace: string;

  sessionSecret: string;
  sessionSalt: string;

  oidcIssuer: Issuer;
  oidcClientId: string;
  oidcClientSecret: string;

  remsUrl: string;
  remsBotUser: string;
  remsBotKey: string;

  logger: LoggerOptions;

  htsget?: {
    maxAge: number;
    url: URL;
  };

  // optional details to allow sharing of objects in AWS
  aws?: {
    // if using AWS then temp bucket is required
    tempBucket: string;
    // it is possible to use AWS but not necessarily use signing
    signingAccessKeyId?: string;
    signingSecretAccessKey?: string;
  };

  // optional signing details to allow sharing of objects in CloudFlare R2
  cloudflare?: {
    signingAccessKeyId: string;
    signingSecretAccessKey: string;
  };

  // Read the README.md for GCP-related configuration

  // the FHIR endpoint for an Ontoserver
  ontoFhirUrl: string;

  // maxmind database for IP Geo lookup
  maxmindDbAssetPath: string;

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

  datasets: {
    name: string;
    uri: string;
    description: string;
    storageLocation: string;
    storageUriPrefix: string;
    aws?: {
      eventDataStoreId?: string;
    };
  }[];
  // options to pass into the rate limiter
  rateLimit: RateLimitPluginOptions;

  // dev/testing settings that can be specified as long as the NODE_ENV is development
  // if NODE_ENV is production then this the presence of any configuration leading to this
  // will fail to launch
  devTesting?: {
    // whether to source the frontend build direct from the dev build location
    sourceFrontEndDirect: boolean;

    allowTestUsers: boolean;

    allowTestRoutes: boolean;
  };
};
