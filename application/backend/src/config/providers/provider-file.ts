import { Token } from "../meta/meta-lexer";
import { promises as fs } from "fs";
import { resolve } from "path";
import { ProviderBase } from "./provider-base";
import json5 from "json5";

/**
 * A provider that can get config from a file
 */
export class ProviderFile extends ProviderBase {
  private readonly fileBase: string;

  constructor(argTokens: Token[]) {
    super();

    if (argTokens.length != 1)
      throw new Error(
        `${ProviderFile.name} expects a single meta parameter specifying the base name of a JSON5 file that will be found in the configuration directories`
      );

    this.fileBase = argTokens[0].value;
  }

  /**
   * Return the configuration data provided by this provider.
   */
  public async getConfig(): Promise<any> {
    const configEntries = await fs.readdir("./config", { withFileTypes: true });

    const onlyJson5Files = configEntries.filter(
      (de) => de.isFile() && de.name.endsWith("json5")
    );

    const fileName = `${this.fileBase}.json5`;

    for (const x of configEntries) {
      if (x.name === fileName) {
        const path = resolve("./config", x.name);
        const content = await json5.parse(await fs.readFile(path, "utf-8"));

        console.log(`Loading configuration from JSON5 file ${path}`);

        return content;
      }
    }

    throw new Error("Configuration file was not found");
  }
}
