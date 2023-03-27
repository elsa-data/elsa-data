import { DependencyContainer } from "tsyringe";
import { registerTypes } from "../test-dependency-injection.common";
import { AwsDiscoveryService } from "../../src/business/services/aws-discovery-service";

let testContainer: DependencyContainer;

describe("Test AWS Discovery Service", () => {
  beforeAll(async () => {
    testContainer = await registerTypes();
  });

  beforeEach(async () => {});

  it("find the copy out service if present", async () => {
    const awsDiscoveryService = testContainer.resolve(AwsDiscoveryService);

    console.log(await awsDiscoveryService.locateCopyOutStepsArn());
  });
});
