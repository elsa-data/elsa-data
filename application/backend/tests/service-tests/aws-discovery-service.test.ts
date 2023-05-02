import { registerTypes } from "../test-dependency-injection.common";
import { AwsDiscoveryService } from "../../src/business/services/aws/aws-discovery-service";
import { AwsEnabledServiceMock } from "./client-mocks";

const testContainer = registerTypes();
let awsEnabledServiceMock: AwsEnabledServiceMock;

describe("Test AWS Discovery Service", () => {
  beforeAll(async () => {
    awsEnabledServiceMock = testContainer.resolve(AwsEnabledServiceMock);
  });

  beforeEach(async () => {
    awsEnabledServiceMock.reset();
  });

  it.skip("find the copy out service if present", async () => {
    awsEnabledServiceMock.enable();
    const awsDiscoveryService = testContainer.resolve(AwsDiscoveryService);

    console.log(await awsDiscoveryService.locateCopyOutStepsArn());
  });
});
