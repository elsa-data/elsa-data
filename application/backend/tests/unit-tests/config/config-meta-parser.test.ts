import { parseMeta } from "../../../src/config/meta/meta-parser";

it("basic parsing of meta syntax results in an array of tokens", async () => {
  // note that this wouldn't be an actually valid meta config as the number/types of params is wrong
  // but we are just testing the parser tokenisation
  const toks = parseMeta(
    " aws-secret('ElsaDev') file('dev' 'abc')  file('prod'  , 5)",
  );

  expect(toks).toHaveLength(3);

  expect(toks[0].providerToken).toHaveProperty("value", "aws-secret");
  expect(toks[0].providerToken).toHaveProperty("col", 2);
  expect(toks[0].argTokens).toHaveLength(1);

  expect(toks[1].providerToken).toHaveProperty("value", "file");
  expect(toks[1].providerToken).toHaveProperty("col", 24);
  expect(toks[1].argTokens).toHaveLength(2);
  expect(toks[1].argTokens[0]).toHaveProperty("value", "dev");
  expect(toks[1].argTokens[1]).toHaveProperty("value", "abc");

  expect(toks[2].providerToken).toHaveProperty("value", "file");
  expect(toks[2].providerToken).toHaveProperty("col", 43);
  expect(toks[2].argTokens).toHaveLength(2);
  expect(toks[2].argTokens[0]).toHaveProperty("value", "prod");
  expect(toks[2].argTokens[1]).toHaveProperty("value", "5");
});
