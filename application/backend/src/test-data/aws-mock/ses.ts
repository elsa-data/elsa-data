import { SESClient } from "@aws-sdk/client-ses";
import { mockClient } from "aws-sdk-client-mock";

export function createMockSes() {
  const sesClientMock = mockClient(SESClient);

  return sesClientMock;
}
