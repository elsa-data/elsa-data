import { Issuer } from "openid-client";
import { RateLimitPluginOptions } from "@fastify/rate-limit";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { LoggerOptions } from "pino";

/**
 * The rich, well-typed settings for Elsa.
 * These somewhat duplicate the config values we get via "convict" - but I have my
 * doubts about convict and am retaining this as a little bridge for a bit.
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

  sessionSecret: string;
  sessionSalt: string;

  oidcIssuer: Issuer;
  oidcClientId: string;
  oidcClientSecret: string;

  remsUrl: string;
  remsBotUser: string;
  remsBotKey: string;

  logger: LoggerOptions;

  awsSigningAccessKeyId: string;
  awsSigningSecretAccessKey: string;
  awsTempBucket: string;

  // the FHIR endpoint for an Ontoserver
  ontoFhirUrl: string;

  // maxmind database for IP Geo lookup
  maxmindDbAssetPath: string;

  // NOTE: https://confluence.hl7.org/display/TA/External+Terminologies+-+Information is a good reference for these
  mondoSystem: { uri: string; oid: string };
  hgncGenesSystem: { uri: string; oid: string };
  hpoSystem: { uri: string; nonPreferredUri: string };
  isoCountrySystemUri: string;
  snomedSystem: { uri: string; oid: string };

  superAdmins: { id: string; email: string }[];

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
