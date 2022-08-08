import { Issuer } from "openid-client";

/**
 * The environment controls elements of the build process and features. It is
 * equivalent to the NodeJs environment. That is, development may have less
 * optimisation and more debug info, production has more optimisation and terse
 * messages. There may also be features that auto enable in development (bypass logins etc).
 *
 * Whilst somewhat equivalent to where the code is run (i.e. production code is more often
 * than not run in the cloud) - it does not speak directly to that - as we may for instance
 * want to run a development build in the cloud. See ElsaLocation.
 */
export type ElsaEnvironment = "development" | "production";

/**
 * The location speaks more to literally what server the software is going to be
 * run on and where the server is located. This allows us to do things like source
 * secrets from the Mac keychain on a Mac, but from AWS secrets manager on AWS.
 */
export type ElsaLocation = "local-mac" | "aws" | "gcp";

export function hasAccessToTheSourceBuildFolders(loc: ElsaLocation) {
  return loc === "local-mac";
}

export function exposedToTheInternet(loc: ElsaLocation) {
  return loc !== "local-mac";
}

/**
 * The rich, well-typed settings for Elsa.
 * These somewhat duplicate the config values we get via "convict" - but I have my
 * doubts about convict and am retaining this as a little bridge for a bit.
 */
export type ElsaSettings = {
  environment: ElsaEnvironment;
  location: ElsaLocation;

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
