import { exec } from "child_process";
import { promisify } from "util";
const execPromise = promisify(exec);

/**
 * Returns a bunch of secret level configuration items from the Mac local keychain.
 */
export async function getConfigLocalMac() {
  // https://coderwall.com/p/5ck85g/storing-secrets-in-the-macos-keychain
  /*
     security add-generic-password -a "$USER" -s 'Elsa Client Id Dev' -w 'qwerty123'
     security add-generic-password -a "$USER" -s 'Elsa Client Secret Dev' -w 'qwerty123'
     security add-generic-password -a "$USER" -s 'Elsa REMS Bot User Dev' -w 'qwerty123'
     security add-generic-password -a "$USER" -s 'Elsa REMS Bot Key Dev' -w 'qwerty123'
     */
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

  // note: these key names need to be kept in sync with the overall configuration schema
  return {
    oidc: {
      clientId: clientIdStdout.trim(),
      clientSecret: clientSecretStdout.trim(),
    },
    rems: {
      botUser: remsUserStdout.trim(),
      botKey: remsKeyStdout.trim(),
    },
  };
}
