import { mockClient } from "aws-sdk-client-mock";
import {
  DiscoverInstancesCommand,
  ServiceDiscoveryClient,
} from "@aws-sdk/client-servicediscovery";
import { MOCK_AWS_OBJECT_SIGNING_SECRET_NAME } from "./secrets-manager";

export function createMockServiceDiscovery() {
  const serviceDiscoveryClientMock = mockClient(ServiceDiscoveryClient);

  serviceDiscoveryClientMock
    .on(DiscoverInstancesCommand, {
      ServiceName: "ElsaDataCopyOut",
    })
    .resolves({
      Instances: [
        {
          Attributes: {
            stateMachineArn: "sdfsf",
          },
        },
      ],
    });

  serviceDiscoveryClientMock
    .on(DiscoverInstancesCommand, {
      ServiceName: "ElsaDataObjectSigning",
    })
    .resolves({
      Instances: [
        {
          Attributes: {
            s3AccessKey: "sdfsf",
            s3AccessKeySecretName: MOCK_AWS_OBJECT_SIGNING_SECRET_NAME,
          },
        },
      ],
    });

  return serviceDiscoveryClientMock;
}
