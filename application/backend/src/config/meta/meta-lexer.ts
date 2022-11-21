import moo from "moo";

export type TokenType =
  | "WS"
  | "integer"
  | "string"
  | "lbracket"
  | "rbracket"
  | "provider";

export type Token = {
  type: TokenType;
  value: string;
};

// possibly overkill - but if our meta syntax develops any complexity it is possibly
// useful that we are using a formal lexer
// https://github.com/no-context/moo
const lexer = moo.compile({
  // note: we include , in the WS - which allows it to be used to break up arguments etc - but is not required
  WS: { match: /[,\s]+/, lineBreaks: true },
  integer: /0|[1-9][0-9]*/,
  string: { match: /'(?:\\["\\]|[^\n'\\])*'/, value: (s) => s.slice(1, -1) },
  lbracket: "(",
  rbracket: ")",
  provider: [
    "aws-secret",
    "gcloud-secret",
    "file",
    "osx-keychain",
    "linux-pass",
  ],
});

// examples

// "aws-secret('ElsaDev') file('dev')"
// "gcloud-secret('ElsaDev') file('dev') osxkeychain('blah.blah',   'a.b')"

export function lexVariable(v: string): Token[] {
  lexer.reset(v);

  return Array.from(lexer) as Token[];
}
