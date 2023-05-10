import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { Token } from "../meta/meta-lexer";
import { ProviderBase } from "./provider-base";
import json5 from "json5";

/**
 * A provider that can get config from a specified AWS secret formatted in JSON5
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

    return json5.parse(secretResult.SecretString);
  }
}
