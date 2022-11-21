import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { set } from "lodash";
import { Token } from "../meta/meta-lexer";
import { ProviderBase } from "./provider-base";

/**
 * A provider that can get config from a specified AWS secret
 */
export class ProviderAwsSecretsManager extends ProviderBase {
  constructor(argTokens: Token[]) {
    super(argTokens, ProviderAwsSecretsManager.name);
  }

  public async getConfig(): Promise<any> {
    const client = new SecretsManagerClient({});

    const secretResult = await client.send(
      new GetSecretValueCommand({ SecretId: this.tokenValue })
    );

    if (secretResult.SecretBinary || !secretResult.SecretString) {
      throw new Error(
        "We expect the Elsa secret to be a secret string (as JSON key/values) - not a SecretBinary"
      );
    }

    console.log(`Loading configuration from AWS secret ${secretResult.ARN}`);

    // because we like to use the secrets manager UI - we record the values there
    // as a flat object of Key/value pairs (with dots in the key name to show nesting).
    // i.e. { "rems.bot": "bot" }
    const flatSecretObject: any = JSON.parse(secretResult.SecretString);

    // we can have some secrets values that are only for use elsewhere - but we don't want to
    // trigger the 'unknown config key' of Convict - so we delete them here before passing them back
    delete flatSecretObject["edgeDb.tlsKey"];
    delete flatSecretObject["edgeDb.tlsCert"];

    // convert the flat object to a nested object that is compatible with convict
    return Object.entries(flatSecretObject).reduce(
      (o, entry) => set(o, entry[0], entry[1]),
      {}
    );
  }
}
