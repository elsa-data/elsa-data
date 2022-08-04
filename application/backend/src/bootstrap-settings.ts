import { exec } from "child_process";
import { promisify } from "util";
import { Issuer } from "openid-client";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { writeFile } from "fs/promises";
import * as temp from "temp";

const execPromise = promisify(exec);

export type ElsaSettings = {
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
};

/**
 * Retrieve secrets/settings from the environment - with no dependence on any particular cloud deployment.
 * Mac specific at the moment - will need extending to support Windows/Linux dev.
 */
export async function getLocalSettings(): Promise<ElsaSettings> {
  // https://coderwall.com/p/5ck85g/storing-secrets-in-the-macos-keychain
  /*
   security add-generic-password -a "$USER" -s 'Elsa Client Id Dev' -w 'qwerty123'
   security add-generic-password -a "$USER" -s 'Elsa Client Secret Dev' -w 'qwerty123'
   security add-generic-password -a "$USER" -s 'Elsa REMS Bot User Dev' -w 'qwerty123'
   security add-generic-password -a "$USER" -s 'Elsa REMS Bot Key Dev' -w 'qwerty123'
   */

  const issuer = await Issuer.discover("https://cilogon.org");

  const { stdout: clientIdStdout, stderr: clientIdStderr } = await execPromise(
    `security find-generic-password -s "Elsa Client Id Dev" -w`
  );
  const { stdout: clientSecretStdout, stderr: clientSecretStderr } =
    await execPromise(
      `security find-generic-password -s "Elsa Client Secret Dev" -w`
    );

  const { stdout: remsUserStdout, stderr: remsUserStderr } = await execPromise(
    `security find-generic-password -s "Elsa REMS Bot User Dev" -w`
  );

  const { stdout: remsKeyStdout, stderr: remsKeyStderr } = await execPromise(
    `security find-generic-password -s "Elsa REMS Bot Key Dev" -w`
  );

  return {
    // the security of our localhost dev cookies is not so important - for the real deployments
    // we need to get these secrets from a real secret source
    sessionSecret:
      "This is a long string that will encrypt our session cookies but only for localhost",
    sessionSalt: "Also a string 16",

    oidcIssuer: issuer,
    oidcClientId: clientIdStdout.trim(),
    oidcClientSecret: clientSecretStdout.trim(),

    remsUrl: "https://hgpp-rems.dev.umccr.org",
    remsBotUser: remsUserStdout.trim(),
    remsBotKey: remsKeyStdout.trim(),

    ontoFhirUrl: "https://onto.prod.umccr.org/fhir",
  };
}

/**
 * Retrieve secrets/settings from an AWS environment
 */
export async function getAwsSettings(): Promise<ElsaSettings> {
  const client = new SecretsManagerClient({});

  const secretResult = await client.send(
    new GetSecretValueCommand({ SecretId: "Elsa" })
  );

  if (secretResult.SecretBinary || !secretResult.SecretString) {
    throw new Error(
      "We expect the Elsa secret to be a secret string (as JSON key/values)"
    );
  }

  const secrets = JSON.parse(secretResult.SecretString);

  const issuer = await Issuer.discover(secrets.oidc_issuer);

  // edge db requires a TLS connection - and so we need to construct our own
  // TLS keys/ca - here just the CA is needed by the client - but it must be
  // as a file on disk
  const root_ca_location = temp.path();
  const root_ca: string = secrets.tls_root_ca.replaceAll("\\n", "\n");

  await writeFile(root_ca_location, root_ca);

  process.env["EDGEDB_TLS_CA_FILE"] = root_ca_location;

  return {
    // NOTE: the way we do fastify secrets (using a secret/salt) requires extra start up time
    // as it does a bunch of crypto work - which is fine in a docker service - if we pivot this to
    // lambdas then we need to reconsider
    sessionSecret: secrets.session_secret,
    sessionSalt: secrets.session_salt,

    oidcIssuer: issuer,
    oidcClientId: secrets.oidc_client_id,
    oidcClientSecret: secrets.oidc_client_secret,

    remsUrl: "https://hgpp-rems.dev.umccr.org",
    remsBotUser: secrets.rems_bot_user,
    remsBotKey: secrets.rems_bot_key,

    ontoFhirUrl: "https://onto.prod.umccr.org/fhir",
  };
}
