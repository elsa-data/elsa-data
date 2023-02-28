import { Token } from "../meta/meta-lexer";
import { ProviderBase } from "./provider-base";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

/**
 * A provider that can get config from a specified GCP secret
 */
export class ProviderGcpSecretsManager extends ProviderBase {
  private readonly secretId: string;

  constructor(argTokens: Token[]) {
    super();

    if (argTokens.length != 1)
      throw new Error(
        `${ProviderGcpSecretsManager.name} expects a single meta parameter specifying the name of an GCP secret`
      );

    this.secretId = argTokens[0].value;
  }

  public async getConfig(): Promise<any> {
    const secretmanagerClient = new SecretManagerServiceClient();
    const request = { name: this.secretId };
    const [response] = await secretmanagerClient.accessSecretVersion(request);

    if (!response || !response.payload || !response.payload.data) {
      throw Error("Secret not present in gcloud: " + this.secretId);
    }

    const secretString =
      response.payload.data instanceof Uint8Array
        ? new TextDecoder().decode(response.payload.data)
        : response.payload.data;

    const flatSecretObject = JSON.parse(secretString);

    // we can have some secrets values that are only for use elsewhere - but we don't want to
    // trigger the 'unknown config key' of Convict - so we delete them here before passing them back
    delete flatSecretObject["edgeDb.tlsKey"];
    delete flatSecretObject["edgeDb.tlsCert"];

    return ProviderBase.nestObject(flatSecretObject);
  }
}
