import { set } from "lodash";

const env_prefix = "ELSA_DATA_CONFIG_";

export function trySetEnvironmentVariableString(
  object: any,
  env_suffix: string,
  path: string,
) {
  const v = process.env[`${env_prefix}${env_suffix}`];
  if (v) set(object, path, v);
}
export function trySetEnvironmentVariableInteger(
  object: any,
  env_suffix: string,
  path: string,
) {
  const v = process.env[`${env_prefix}${env_suffix}`];
  if (v) set(object, path, parseInt(v));
}

export const environmentVariableMap = {
  SERVICE_DISCOVERY_NAMESPACE: "serviceDiscoveryNamespace",

  AWS_TEMP_BUCKET: "aws.tempBucket",

  DEPLOYED_URL: "deployedUrl",

  HTTP_HOSTING_HOST: "httpHosting.host",
  // NOTE we do have HTTP_HOSTING_PORT but it returns an integer so we do it specially elsewhere
  HTTP_HOSTING_SESSION_SECRET: "httpHosting.session.secret", //pragma: allowlist secret
  HTTP_HOSTING_SESSION_SALT: "httpHosting.session.salt",

  LOGGER_LEVEL: "logger.level",

  MAILER_OPTIONS: "mailer.options",
  MAILER_DEFAULTS: "mailer.defaults",
  MAILER_MODE: "mailer.mode",
};
