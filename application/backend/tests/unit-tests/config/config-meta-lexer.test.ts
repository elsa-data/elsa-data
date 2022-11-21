import { lexVariable } from "../../../src/config/meta/meta-lexer";

it("basic lexing of meta syntax", async () => {
  const toks = lexVariable("aws-secret('ElsaDev')   file('dev' 'a.b', 111)");

  expect(toks).toHaveLength(13);

  expect(toks[0]).toHaveProperty("col", 1);
  expect(toks[0]).toHaveProperty("line", 1);
  expect(toks[0]).toHaveProperty("value", "aws-secret");
  expect(toks[0]).toHaveProperty("text", "aws-secret");
  expect(toks[0]).toHaveProperty("type", "provider");

  expect(toks[1]).toHaveProperty("col", 11);
  expect(toks[1]).toHaveProperty("value", "(");

  expect(toks[2]).toHaveProperty("col", 12);
  expect(toks[2]).toHaveProperty("value", "ElsaDev");

  expect(toks[3]).toHaveProperty("col", 21);
  expect(toks[3]).toHaveProperty("value", ")");

  expect(toks[4]).toHaveProperty("col", 22);
  expect(toks[4]).toHaveProperty("text", "   ");
  expect(toks[4]).toHaveProperty("type", "WS");

  expect(toks[5]).toHaveProperty("col", 25);
  expect(toks[5]).toHaveProperty("text", "file");

  expect(toks[6]).toHaveProperty("col", 29);
  expect(toks[6]).toHaveProperty("value", "(");
  expect(toks[6]).toHaveProperty("type", "lbracket");

  expect(toks[7]).toHaveProperty("col", 30);
  // note: the text and value for strings differs
  expect(toks[7]).toHaveProperty("text", "'dev'");
  expect(toks[7]).toHaveProperty("value", "dev");
  expect(toks[7]).toHaveProperty("type", "string");

  expect(toks[8]).toHaveProperty("col", 35);
  expect(toks[8]).toHaveProperty("value", " ");

  expect(toks[9]).toHaveProperty("col", 36);
  expect(toks[9]).toHaveProperty("value", "a.b");

  expect(toks[10]).toHaveProperty("col", 41);
  expect(toks[10]).toHaveProperty("value", ", ");

  expect(toks[11]).toHaveProperty("col", 43);
  expect(toks[11]).toHaveProperty("value", "111");
  expect(toks[11]).toHaveProperty("type", "integer");

  expect(toks[12]).toHaveProperty("col", 46);
  expect(toks[12]).toHaveProperty("value", ")");
});
