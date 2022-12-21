import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { Token } from "../meta/meta-lexer";
import { ProviderBase } from "./provider-base";

/**
 * A provider that can get config from a specified AWS secret
 */
export class ProviderAwsSecretsManager extends ProviderBase {
  private readonly secretId: string;

  constructor(argTokens: Token[]) {
    super();

    if (argTokens.length != 1)
      throw new Error(
        `${ProviderAwsSecretsManager.name} expects a single meta parameter specifying the name of an AWS secret`
      );

    this.secretId = argTokens[0].value;
  }

  public async getConfig(): Promise<any> {
    const client = new SecretsManagerClient({});

    const secretResult = await client.send(
      new GetSecretValueCommand({ SecretId: this.secretId })
    );

    if (secretResult.SecretBinary || !secretResult.SecretString) {
      throw new Error(
        "We expect the Elsa secret to be a secret string (as JSON key/values) - not a SecretBinary"
      );
    }

    // because we like to use the secrets manager UI - we record the values there
    // as a flat object of Key/value pairs (with dots in the key name to show nesting).
    // i.e. { "rems.bot": "bot" }
    const flatSecretObject: any = JSON.parse(secretResult.SecretString);

    // we can have some secrets values that are only for use elsewhere - but we don't want to
    // trigger the 'unknown config key' of Convict - so we delete them here before passing them back
    delete flatSecretObject["edgeDb.tlsKey"];
    delete flatSecretObject["edgeDb.tlsCert"];

    return ProviderBase.nestObject(flatSecretObject);
  }
}
