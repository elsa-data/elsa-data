import { lexVariable, Token } from "./meta-lexer";
import _ from "lodash";

export type ProviderMeta = {
  providerToken: Token;
  argTokens: Token[];
};

/**
 * Given a simple meta config syntax string, returns the Providers and Arguments
 * for a series of configuration provider sources.
 * @param meta
 */
export function parseMeta(meta: string): ProviderMeta[] {
  const results: ProviderMeta[] = [];

  const toks = lexVariable(meta).filter((t) => t.type !== "WS");
  let tokIndex = 0;
  let providerToken: Token | undefined = undefined;
  let argTokens: Token[] | undefined = undefined;

  while (tokIndex < toks.length) {
    const currentTok = toks[tokIndex];

    if (currentTok.type === "provider") {
      if (!providerToken) providerToken = currentTok;
      else
        throw new Error(
          "You must close off the arguments with a ) before naming another provider"
        );
    }

    if (currentTok.type === "lbracket") {
      if (!providerToken)
        throw new Error(
          "Left bracket shouldn't be encountered till after a provider name"
        );

      if (!_.isUndefined(argTokens))
        throw new Error(
          "Once an argument list is started it needs a ) to terminate"
        );

      argTokens = [];
    }

    if (currentTok.type === "rbracket") {
      if (_.isUndefined(providerToken))
        throw new Error(
          "Right bracket shouldn't be encountered till after a provider name"
        );

      if (_.isUndefined(argTokens))
        throw new Error(
          "Right bracket shouldn't be encountered till after a left bracket"
        );

      // rbracket completes the provider details - we push a new provider result
      results.push({
        providerToken: providerToken,
        argTokens: argTokens,
      });

      // and reset our state
      providerToken = undefined;
      argTokens = undefined;
    }

    if (currentTok.type === "string") {
      if (_.isUndefined(providerToken))
        throw new Error(
          "String argument shouldn't be encountered till after a left bracket"
        );

      if (_.isUndefined(argTokens))
        throw new Error(
          "String argument shouldn't be encountered till after a left bracket"
        );

      argTokens!.push(currentTok);
    }

    if (currentTok.type === "number") {
      if (_.isUndefined(providerToken))
        throw new Error(
          "Number argument shouldn't be encountered till after a left bracket"
        );

      if (_.isUndefined(argTokens))
        throw new Error(
          "Number argument shouldn't be encountered till after a left bracket"
        );

      argTokens!.push(currentTok);
    }

    tokIndex++;
  }

  // we consider it an error to end the meta config with a partially filled in provider
  if (!_.isUndefined(providerToken))
    throw new Error("Unterminated provider expression");

  if (!_.isUndefined(argTokens))
    throw new Error("Unterminated provider arguments expression");

  return results;
}
