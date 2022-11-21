import { Token } from "../meta/meta-lexer";
import { ProviderBase } from "./provider-base";
import { execFile } from "child_process";
import { promisify } from "util";
import { readdirSync } from "fs";
import { join, resolve, parse } from "node:path";
import { homedir } from "os";

const execPromise = promisify(execFile);

/**
 * A provider that can get config from specific entries in an OsX keychain
 */
export class ProviderLinuxPass extends ProviderBase {
  constructor(argTokens: Token[]) {
    super(argTokens);
  }

  public async getConfig(): Promise<any> {
    const passFolder =
      process.env.PASSWORD_STORE_DIR ?? join(homedir(), "/.password-store");
    const elsaPassFolder = resolve(join(passFolder, this.tokenValue));

    const values: { [k: string]: string } = {};

    for (const pass of readdirSync(elsaPassFolder)) {
      const passName = parse(pass).name;
      const passPath = join(this.tokenValue, passName);
      try {
        const { stdout: passValue } = await execPromise("pass", [
          "show",
          passPath,
        ]);
        values[passName] = passValue.trim();
      } catch (error) {}
    }

    return ProviderBase.nestObject(values);
  }
}
