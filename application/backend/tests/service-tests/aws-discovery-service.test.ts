import { registerTypes } from "../test-dependency-injection.common";
import { AwsDiscoveryService } from "../../src/business/services/aws-discovery-service";

const testContainer = registerTypes();

describe("Test AWS Discovery Service", () => {
  beforeAll(async () => {});

  beforeEach(async () => {});

  it("find the copy out service if present", async () => {
    const awsDiscoveryService = testContainer.resolve(AwsDiscoveryService);

    console.log(await awsDiscoveryService.locateCopyOutStepsArn());
  });
});
