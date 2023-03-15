import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { Client } from "edgedb";
import { ManifestService } from "../../src/business/services/manifests/manifest-service";

let edgeDbClient: Client;
let testReleaseKey: string;
let manifestService: ManifestService;

beforeAll(async () => {
  const testContainer = await registerTypes();

  edgeDbClient = testContainer.resolve("Database");
  manifestService = testContainer.resolve(ManifestService);
});

beforeEach(async () => {
  ({ testReleaseKey } = await beforeEachCommon());
});

it("test basic operation of manifest helper", async () => {
  const manifest = await manifestService.createMasterManifest(
    edgeDbClient,
    testReleaseKey,
    false,
    true,
    true,
    true,
    true
  );
});
