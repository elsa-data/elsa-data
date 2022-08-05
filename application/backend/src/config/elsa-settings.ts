import { Issuer } from "openid-client";

/**
 * The rich, well-typed settings for Elsa.
 * These somewhat duplicate the config values we get via "convict" - but I have my
 * doubts about convict and am retaining this as a little bridge for a bit.
 */
export type ElsaSettings = {
  port: number;

  sessionSecret: string;
  sessionSalt: string;

  oidcIssuer: Issuer;
  oidcClientId: string;
  oidcClientSecret: string;

  remsUrl: string;
  remsBotUser: string;
  remsBotKey: string;

  // the FHIR endpoint for an Ontoserver
  ontoFhirUrl: string;

  superAdmins: { id: string; email: string }[];
};
