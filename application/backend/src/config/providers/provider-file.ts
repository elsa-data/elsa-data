import { Token } from "../meta/meta-lexer";
import { promises as fs, constants } from "fs";
import path, { resolve } from "path";
import { ProviderBase } from "./provider-base";
import json5 from "json5";
import { CONFIG_FOLDERS_ENVIRONMENT_VAR } from "../config-constants";

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
    // default to just the local ./config folder
    // TODO: security implications? Should we fix the relative start path rather than relying on "./"
    // (i.e we definitely want to support relative paths.. but maybe we should control the starting
    // point more than relying on the current directory at launch)
    const foldersEnv =
      process.env[CONFIG_FOLDERS_ENVIRONMENT_VAR] ?? "./config";

    // we are going to construct absolute paths for all our specified config folders (and also do some
    // sanity testing)
    const foldersAbsolute: string[] = [];
    const foldersNotFound: string[] = [];

    for (const folderName of foldersEnv.split(path.delimiter)) {
      let duplicate = false;

      try {
        // this will fail if the path is not resolvable
        const rp = await fs.realpath(folderName);

        // this should fail if the path is not readable
        await fs.access(rp, constants.R_OK);

        // resolving to the same path can lead to some ambiguity (which one wins?) so
        // instead we will error out - I can't think of any actual use case for listing folders twice
        if (foldersAbsolute.includes(rp)) duplicate = true;
        else foldersAbsolute.push(rp);
      } catch (e) {
        foldersNotFound.push(folderName);
      }

      if (duplicate)
        throw new Error(
          `Folder name ${folderName} resolved to a folder we have already had listed`
        );
    }

    for (const folder of foldersAbsolute) {
      // we are trying to avoid any possible security shenanigans where files outside the
      // listed locations are sourced (i.e some says file('../../etc/hosts')
      // here we ask node for the plain filename of each JSON5 files in the config directory -
      // the input can have whatever shenanigans it wants - we just won't even possibly string match
      const configEntries = await fs.readdir(folder, { withFileTypes: true });

      // TODO: consider whether YAML should also be supported as the config file format

      const onlyJson5Files = configEntries.filter(
        (de) => de.isFile() && de.name.endsWith("json5")
      );

      const fileName = `${this.fileBase}.json5`;

      for (const x of onlyJson5Files) {
        if (x.name === fileName) {
          const path = resolve(folder, x.name);
          const content = await json5.parse(await fs.readFile(path, "utf-8"));

          console.log(`Loading configuration from JSON5 file ${path}`);

          return content;
        }
      }
    }

    const baseMessage = `Configuration file ${
      this.fileBase
    } (.json5) was not found in any of the configuration folders ${foldersAbsolute.join(
      path.delimiter
    )}`;

    if (foldersNotFound.length > 0) {
      throw new Error(
        `${baseMessage}, though the following folders ${foldersNotFound.join(
          path.delimiter
        )} were deemed not accessible so were not inspected`
      );
    } else throw new Error(baseMessage);
  }
}
