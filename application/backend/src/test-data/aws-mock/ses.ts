import { mockClient } from "aws-sdk-client-mock";
import { SESClient } from "@aws-sdk/client-ses";

export function createMockSes() {
  const sesClientMock = mockClient(SESClient);

  return sesClientMock;
}
