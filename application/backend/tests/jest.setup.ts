import "reflect-metadata";

jest.setTimeout(60000);

process.env["ELSA_DATA_VERSION"] = "jesttest";
process.env["ELSA_DATA_BUILT"] = "today";
process.env["ELSA_DATA_REVISION"] = "123456";
