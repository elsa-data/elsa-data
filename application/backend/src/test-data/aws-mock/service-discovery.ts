import { mockClient } from "aws-sdk-client-mock";
import {
  DiscoverInstancesCommand,
  ServiceDiscoveryClient,
} from "@aws-sdk/client-servicediscovery";
import { MOCK_AWS_OBJECT_SIGNING_SECRET_NAME } from "./secrets-manager";
import { MOCK_COPY_OUT_STEPS_ARN } from "./steps";

export function createMockServiceDiscovery() {
  const serviceDiscoveryClientMock = mockClient(ServiceDiscoveryClient);

  serviceDiscoveryClientMock
    .on(DiscoverInstancesCommand, {
      ServiceName: "CopyOut",
    })
    .resolves({
      Instances: [
        {
          Attributes: {
            stateMachineArn: MOCK_COPY_OUT_STEPS_ARN,
          },
        },
      ],
    });

  serviceDiscoveryClientMock
    .on(DiscoverInstancesCommand, {
      ServiceName: "ObjectSigning",
    })
    .resolves({
      Instances: [
        {
          Attributes: {
            s3AccessKeySecretName: MOCK_AWS_OBJECT_SIGNING_SECRET_NAME,
          },
        },
      ],
    });

  return serviceDiscoveryClientMock;
}
