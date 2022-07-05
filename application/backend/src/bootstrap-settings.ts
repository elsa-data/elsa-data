import { exec } from "child_process";
import { promisify } from "util";
import { Issuer } from "openid-client";

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
  // security add-generic-password -a "$USER" -s 'Elsa REMS Bot User Dev' -w 'qwerty123'
  // security add-generic-password -a "$USER" -s 'Elsa REMS Bot Key Dev' -w 'qwerty123'

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
