import { lexVariable } from "../../src/config/meta/meta-lexer";
import { parseMeta } from "../../src/config/meta/meta-parser";

it("basic parsing of meta syntax", async () => {
  const toks = parseMeta("aws-secret('ElsaDev') file('dev')");

  console.debug(toks);
});
