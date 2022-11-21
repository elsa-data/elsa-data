import { Token } from "../meta/meta-lexer";
import { ProviderBase } from "./provider-base";
import { exec } from "child_process";
import { promisify } from "util";
import { set } from "lodash";
import { readdirSync } from "fs";
import { join, resolve, parse } from "node:path";
import { homedir } from "os";
const execPromise = promisify(exec);

/**
 * A provider that can get config from specific entries in an OsX keychain
 */
export class ProviderLinuxPass extends ProviderBase {
  private readonly keychainName: string;

  constructor(argTokens: Token[]) {
    super();

    if (argTokens.length != 1)
      throw new Error(
        `${ProviderLinuxPass.name} expects a single meta parameter specifying the name of the keychain holding configuration values`
      );

    this.keychainName = argTokens[0].value;
  }

  public async getConfig(): Promise<any> {
    const passFolder =
      process.env.PASSWORD_STORE_DIR ?? join(homedir(), "/.password-store");
    const elsaPassFolder = resolve(join(passFolder, this.keychainName));

    const values: { [k: string]: string } = {};

    for (const pass of readdirSync(elsaPassFolder)) {
      const passName = parse(pass).name;
      const passPath = join(this.keychainName, passName);
      try {
        const { stdout: passValue } = await execPromise(
          `pass show ${passPath}`
        );
        values[passName] = passValue.trim();
      } catch (error) {}
    }

    return Object.entries(values).reduce(
      (o, entry) => set(o, entry[0], entry[1]),
      {}
    );
  }
}
