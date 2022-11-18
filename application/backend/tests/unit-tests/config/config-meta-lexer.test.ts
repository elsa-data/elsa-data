import { lexVariable } from "../../src/config/meta/meta-lexer";

it("basic lexing of meta syntrax", async () => {
  const toks = lexVariable("aws-secret('ElsaDev') file('dev')");

  console.debug(toks);
});

it("advanced lexing of meta syntax", async () => {
  const toks = lexVariable(
    "gcloud-secret('ElsaDev') file('dev') osx-keychain('blah.blah' 'a.b' 111)"
  );

  console.debug(toks);
});
