import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { set } from "lodash";

// TODO: should this be some sort of parameter - overrideable?
const SECRET_ID = "Elsa";

/**
 * Converts a key/value secret in AWS SecretsManager into a JSON object that can be used for
 * merging in the configuration system.
 */
export async function getConfigAwsSecretsManager() {
  const client = new SecretsManagerClient({});

  const secretResult = await client.send(
    new GetSecretValueCommand({ SecretId: SECRET_ID })
  );

  if (secretResult.SecretBinary || !secretResult.SecretString) {
    throw new Error(
      "We expect the Elsa secret to be a secret string (as JSON key/values) - not a SecretBinary"
    );
  }

  // because we like to use the secrets manager UI - we record the values there
  // as a flat object of Key/value pairs (with dots in the key name to show nesting).
  // i.e. { "rems.bot": "bot" }
  const flatSecretObject: Object = JSON.parse(secretResult.SecretString);

  // convert the flat object to a nested object that is compatible with convict
  return Object.entries(flatSecretObject).reduce(
    (o, entry) => set(o, entry[0], entry[1]),
    {}
  );
}
