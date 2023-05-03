import { registerTypes } from "../test-dependency-injection.common";
import { AwsDiscoveryService } from "../../src/business/services/aws/aws-discovery-service";
import { AwsEnabledServiceMock } from "./client-mocks";
import {
  DiscoverInstancesCommand,
  ServiceDiscoveryClient,
} from "@aws-sdk/client-servicediscovery";
import { mockClient } from "aws-sdk-client-mock";

const testContainer = registerTypes();
const serviceDiscoveryClientMock = mockClient(ServiceDiscoveryClient);
let awsEnabledServiceMock: AwsEnabledServiceMock;

describe("Test AWS Discovery Service", () => {
  beforeAll(async () => {
    awsEnabledServiceMock = testContainer.resolve(AwsEnabledServiceMock);
  });

  beforeEach(async () => {
    awsEnabledServiceMock.reset();

    serviceDiscoveryClientMock.reset();
  });

  it("find the copy out service if present", async () => {
    serviceDiscoveryClientMock.on(DiscoverInstancesCommand).resolves({
      Instances: [
        {
          Attributes: { AWS_INSTANCE_IPV4: "0.0.0.0" },
          HealthStatus: "UNKNOWN",
        },
        {
          Attributes: { stateMachineArn: "located:arn" },
        },
      ],
    });

    awsEnabledServiceMock.enable();
    const awsDiscoveryService = testContainer.resolve(AwsDiscoveryService);

    expect(await awsDiscoveryService.locateCopyOutStepsArn()).toEqual(
      "located:arn"
    );
  });
});
