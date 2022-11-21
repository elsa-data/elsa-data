import {Token} from "../meta/meta-lexer";

export abstract class ProviderBase {
  private readonly _tokenValue: string;

  protected constructor(argTokens: Token[], name: string) {
    if (argTokens.length != 1)
      throw new Error(
        `${name} expects a single meta parameter specifying the name of the keychain holding configuration values`
      );

    this._tokenValue = argTokens[0].value;
  }

  get tokenValue(): string {
    return this._tokenValue;
  }

  public abstract getConfig(): Promise<any>;
}
