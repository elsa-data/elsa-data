import { AuthenticatedUser } from "../../../src/business/authenticated-user";
import { registerTypes } from "../../test-dependency-injection.common";
import { PhenopacketFirstDatasetImportService } from "../../../src/business/services/australian-genomics/phenopacket-first-dataset-import-service";
import { resolve } from "path";

let pfService: PhenopacketFirstDatasetImportService;

const testContainer = registerTypes();

beforeAll(async () => {});

describe("AWS s3 client", () => {
  beforeAll(async () => {
    pfService = testContainer.resolve(PhenopacketFirstDatasetImportService);
  });

  beforeEach(async () => {});

  afterEach(async () => {});

  it("test directory load", async () => {
    await pfService.createObjectsFromFiles(resolve(__dirname, "test1"));
  });
});
