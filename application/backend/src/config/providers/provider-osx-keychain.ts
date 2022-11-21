import { Token } from "../meta/meta-lexer";
import { ProviderBase } from "./provider-base";
import { exec } from "child_process";
import { promisify } from "util";
const execPromise = promisify(exec);

/**
 * A provider that can get config from specific entries in an OsX keychain
 */
export class ProviderOsxKeychain extends ProviderBase {
  constructor(argTokens: Token[]) {
    super(argTokens);
  }

  public async getConfig(): Promise<any> {
    // https://coderwall.com/p/5ck85g/storing-secrets-in-the-macos-keychain

    if (this.tokenValue.toLowerCase() === "login") {
      throw new Error(
        "The login keychain cannot be used for storing Elsa Data configuration - use a custom keychain"
      );
    }

    const { stdout: dumpKeychainStdout, stderr: dumpKeychainStderr } =
      await execPromise(`security dump-keychain -r ${this.tokenValue}`);

    // NOTE: this is extremely susceptible to changes in OS-X cli tool output - but Apple gives us no other
    // way to enumerate the keys in a keychain
    const keysFound: string[] = [];

    const KEY_PREFIX = '    0x00000007 <blob>="';

    for (const d of dumpKeychainStdout.split("\n")) {
      if (d.startsWith(KEY_PREFIX)) {
        const keyAlmost = d.substring(KEY_PREFIX.length).trimEnd();
        if (keyAlmost.endsWith('"'))
          keysFound.push(keyAlmost.substring(0, keyAlmost.length - 1));
        else
          throw new Error(
            `Discovered a key name that wasn't quite in the format we expected - the entire line was ->${d.trimEnd()}<-`
          );
      }
    }

    const values: { [k: string]: string } = {};

    for (const k of keysFound) {
      const { stdout: lookupStdout, stderr: lookupStderr } = await execPromise(
        `security find-generic-password -s "${k}" -w ${this.tokenValue}`
      );

      values[k] = lookupStdout.trim();
    }

    return ProviderBase.nestObject(values);
  }
}
