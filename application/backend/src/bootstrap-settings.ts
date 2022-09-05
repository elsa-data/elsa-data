import { Issuer } from "openid-client";
import { writeFile } from "fs/promises";
import * as temp from "temp";
import {
  ElsaEnvironment,
  ElsaLocation,
  ElsaSettings,
} from "./config/elsa-settings";
import { getConfigLocalMac } from "./config/config-local-mac";
import { getConfigAwsSecretsManager } from "./config/config-aws-secrets-manager";
import { getConfig } from "./config/config-schema";

/**
 * Converts out configuration files (which are at best primitive values like string/numbers)
 * into a settings object - which can be constructed Objects like Issuer etc.
 *
 * @param environment
 * @param location
 */
export async function getSettings(
  environment: ElsaEnvironment,
  location: ElsaLocation
): Promise<ElsaSettings> {
  const config = await getConfig(environment, location);

  console.log("The raw configuration found is");
  console.log(config.toString());

  // we now have our 'config' - which is the plain text values from all our configuration sources..
  // however our 'settings' are more than that - the settings involve things that need to be
  // constructed/discovered etc. Settings might involve writing a cert file to disk and setting
  // a corresponding env variable.
  const issuer = await Issuer.discover(config.get("oidc.issuerUrl")!);

  const rootCa = config.get("edgeDb.tlsRootCa");

  if (rootCa) {
    // edge db requires a TLS connection - and so we need to construct our own
    // TLS keys/ca. Here just the CA is needed by the client - but it must be
    // as a file on disk
    const rootCaLocation = temp.path();

    console.log(
      `Discovered TLS Root CA configuration so constructing CA on disk at ${rootCaLocation} and setting path in environment variable EDGEDB_TLS_CA_FILE`
    );

    await writeFile(rootCaLocation, rootCa);

    process.env["EDGEDB_TLS_CA_FILE"] = rootCaLocation;
  }

  return {
    environment: environment,
    location: location,
    port: config.get("port"),
    oidcClientId: config.get("oidc.clientId")!,
    oidcClientSecret: config.get("oidc.clientSecret")!,
    oidcIssuer: issuer,
    sessionSecret: config.get("session.secret")!,
    sessionSalt: config.get("session.salt")!,
    remsBotKey: config.get("rems.botKey")!,
    remsBotUser: config.get("rems.botUser")!,
    remsUrl: "https://hgpp-rems.dev.umccr.org",
    ontoFhirUrl: "https://onto.prod.umccr.org/fhir",
    superAdmins: (config.get("superAdmins") as any[]) ?? [],
  };
}
