import {Token} from "../meta/meta-lexer";
import {set} from "lodash";

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

  /**
   * convert a flat object to a nested object that is compatible with convict.
   */
  protected static nestObject<T>(o: {[p: string]: T} | ArrayLike<T>): {} {
    return Object.entries(o).reduce(
      (o, entry) => set(o, entry[0], entry[1]),
      {}
    );
  }

  /**
   * Get the config associated with the provider.
   */
  public abstract getConfig(): Promise<any>;
}
