import { Token } from "../meta/meta-lexer";
import { ProviderBase } from "./provider-base";
import { execFile } from "child_process";
import { promisify } from "util";
import { readdirSync } from "fs";
import { join, resolve, parse } from "node:path";
import { homedir } from "os";

const execPromise = promisify(execFile);

/**
 * A provider that can get config from specific entries in a linux password store.
 */
export class ProviderLinuxPass extends ProviderBase {
  private readonly passwordStoreName: string;

  constructor(argTokens: Token[]) {
    super();

    if (argTokens.length != 1)
      throw new Error(
        `${ProviderLinuxPass.name} expects a single meta parameter specifying the name of the password store holding configuration values`,
      );

    this.passwordStoreName = argTokens[0].value;
  }

  public async getConfig(): Promise<any> {
    const passFolder =
      process.env.PASSWORD_STORE_DIR ?? join(homedir(), "/.password-store");
    const elsaPassFolder = resolve(join(passFolder, this.passwordStoreName));

    const values: { [k: string]: string } = {};

    for (const pass of readdirSync(elsaPassFolder)) {
      const passName = parse(pass).name;
      const passPath = join(this.passwordStoreName, passName);

      try {
        const { stdout: passValue } = await execPromise("pass", [
          "show",
          passPath,
        ]);
        values[passName] = passValue.trim();
      } catch (error) {}
    }

    return values;
  }
}
