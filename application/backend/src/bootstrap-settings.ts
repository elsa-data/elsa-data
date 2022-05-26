import { exec } from "child_process";
import { promisify } from "util";
import { Issuer } from "openid-client";

const execPromise = promisify(exec);

export type ElsaSettings = {
  oidcIssuer: Issuer;
  oidcClientId: string;
  oidcClientSecret: string;
};

/**
 * Retrieve secrets/settings from the environment - with no dependence on any particular cloud deployment
 */
export async function getLocalSettings(): Promise<ElsaSettings> {
  // https://coderwall.com/p/5ck85g/storing-secrets-in-the-macos-keychain

  const issuer = await Issuer.discover("https://accounts.google.com");

  const { stdout: clientIdStdout, stderr: clientIdStderr } = await execPromise(
    `security find-generic-password -s "Elsa Client Id Dev" -w`
  );
  const { stdout: clientSecretStdout, stderr: clientSecretStderr } =
    await execPromise(
      `security find-generic-password -s "Elsa Client Secret Dev" -w`
    );

  return {
    oidcIssuer: issuer,
    oidcClientId: clientIdStdout.trim(),
    oidcClientSecret: clientSecretStdout.trim(),
  };
}
