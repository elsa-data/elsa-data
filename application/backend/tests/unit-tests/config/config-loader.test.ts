import { lexVariable } from "../../src/config/meta/meta-lexer";
import { parseMeta } from "../../src/config/meta/meta-parser";
import { getMetaConfig } from "../../src/config/config-schema";

it("basic parsing of meta syntax", async () => {
  const x = await getMetaConfig(
    "file('base') file('environment-development') aws-secret('ElsaDataLocalhost')"
  );

  console.debug(x.toString());
});

it("basic parsing but with env variable override", async () => {
  process.env["ELSA_DATA_CONFIG_PORT"] = "9999";

  const x = await getMetaConfig(
    "file('base') file('environment-development') aws-secret('ElsaDataLocalhost')"
  );

  console.debug(x.toString());
});

it("parser error with double left bracket", async () => {
  const x = await getMetaConfig(
    "file(('base') file('environment-development') aws-secret('ElsaDataLocalhost')"
  );
});
