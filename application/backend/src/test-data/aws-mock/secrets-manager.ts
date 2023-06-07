import { mockClient } from "aws-sdk-client-mock";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export const MOCK_AWS_OBJECT_SIGNING_SECRET_NAME = "arn:abc"; // pragma: allowlist secret

export function createMockSecretsManager() {
  const secretsManagerClientMock = mockClient(SecretsManagerClient);

  secretsManagerClientMock
    .onAnyCommand()
    .rejects("All calls to Secrets Manager need to be mocked");

  secretsManagerClientMock
    .on(GetSecretValueCommand, {
      SecretId: MOCK_AWS_OBJECT_SIGNING_SECRET_NAME, // pragma: allowlist secret
    })
    .resolves({
      SecretString: "abc", // pragma: allowlist secret
    });

  return secretsManagerClientMock;
}
