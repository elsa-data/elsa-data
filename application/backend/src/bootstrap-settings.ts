import { Issuer } from "openid-client";
import { ElsaSettings } from "./config/elsa-settings";
import _ from "lodash";
import { ElsaConfigurationType } from "./config/config-schema";
import * as path from "path";
import { OidcType } from "./config/config-schema-oidc";
import { SharerType } from "./config/config-schema-sharer";

/**
 * Enrich the raw OIDC configuration by creating an Issuer
 * instance.
 *
 * @param allowEmptyIssuer
 * @param oidcConfiguration
 */
export async function oidcConfigurationToSettings(
  allowEmptyIssuer: boolean,
  oidcConfiguration?: OidcType
) {
  if (!oidcConfiguration) return undefined;

  let issuer: Issuer | undefined = undefined;

  if (oidcConfiguration.issuerUrl) {
    issuer = await Issuer.discover(oidcConfiguration.issuerUrl);
  } else {
    if (!allowEmptyIssuer)
      throw new Error(
        "Only localhost development launches can exist without setting up an OIDC issuer"
      );
  }

  return {
    issuer: issuer,
    clientId: oidcConfiguration.clientId,
    clientSecret: oidcConfiguration.clientSecret,
  };
}

export async function bootstrapSettings(
  config: ElsaConfigurationType
): Promise<ElsaSettings> {
  // we now have our 'config' - which is the plain text values from all our configuration sources..
  // however our 'settings' are more than that - the settings involve things that need to be
  // constructed/discovered etc.
  // Settings might involve writing a cert file to disk and setting a corresponding env variable.
  // Settings might involve doing OIDC discovery and then using the returned value

  const logoPath = _.get(config, "branding.logoPath");
  let logoUriRelative: string | undefined;
  if (logoPath) {
    logoUriRelative = `/branding/logo${path.extname(logoPath)}`;
  }

  // we are in dev *only* if it is made explicit
  const isDevelopment = process.env["NODE_ENV"] === "development";

  // we are prepared to default this to localhost
  let deployedUrl = `http://localhost:${config.httpHosting.port}`;
  let isLocalhost = true;

  // but only if we are in dev and deployedUrl is not set in the config itself
  if (_.has(config, "deployedUrl")) {
    deployedUrl = _.get(config, "deployedUrl")!;
    isLocalhost = false;
    if (!deployedUrl.startsWith("https://"))
      throw new Error("Deployed URL setting must be using HTTPS");
    if (deployedUrl.endsWith("/"))
      throw new Error("Deployed URL setting must not end with a slash");
  } else {
    if (!isDevelopment)
      throw new Error(
        "Only development launches can default to the use of localhost"
      );
  }

  let loggerTransportTargets: any[] = _.get(config, "logger.transportTargets");

  // grab the targets from our config - but default to a sensible default that just logs to stdout
  // (if someone wants no logs they can set the level to silent)
  if (!_.isArray(loggerTransportTargets) || loggerTransportTargets.length < 1)
    loggerTransportTargets = [
      {
        target: "pino/file",
      },
    ];

  const logLevel = config.logger.level;

  if (logLevel) loggerTransportTargets.forEach((l) => (l.level ??= logLevel));

  const hasAws = config.aws?.tempBucket;

  const hasCloudflare =
    _.get(config, "cloudflare.signingAccessKeyId") &&
    _.get(config, "cloudflare.signingAccessKeyId");

  // whilst it is probably needed eventually that we support multiple sharers of each type
  // (for instance to support multiple htsget endpoints) - for the moment we have not thought
  // this through and hence limit it to one of each
  const sharers: SharerType[] = _.get(config, "sharers");
  const sharerTypes = sharers.map((s) => s.type);

  const sharerDuplicates = sharerTypes.filter(
    (item, index) => sharerTypes.indexOf(item) !== index
  );

  if (sharerDuplicates.length > 0)
    throw new Error(
      `For the moment, only a single sharer of each type can be specified. The following sharers types are duplicated -> ${sharerDuplicates}`
    );

  return {
    deployedUrl: deployedUrl,
    serviceDiscoveryNamespace:
      _.get(config, "serviceDiscoveryNamespace") ?? "elsa-data",
    httpHosting: _.get(config, "httpHosting"),
    mailer: config.mailer ? _.get(config, "mailer") : undefined,
    oidc: await oidcConfigurationToSettings(
      isDevelopment || isLocalhost,
      config.oidc
    ),
    feature: _.get(config, "feature"),
    aws: hasAws
      ? {
          tempBucket: _.get(config, "aws.tempBucket"),
        }
      : undefined,
    cloudflare: hasCloudflare
      ? {
          signingAccessKeyId: _.get(config, "cloudflare.signingAccessKeyId"),
          signingSecretAccessKey: _.get(
            config,
            "cloudflare.signingAccessKeyId"
          ),
        }
      : undefined,
    dacs: _.get(config, "dacs"),
    sharers: sharers,
    logger: {
      name: "elsa-data",
      level: logLevel,
      transport: {
        targets: loggerTransportTargets,
      },
    },
    ontoFhirUrl: _.get(config, "ontoFhirUrl")!,
    maxmindDbAssetPath: _.get(config, "maxmindDbAssetPath")!,
    releaseKeyPrefix: _.get(config, "releaseKeyPrefix"),
    mondoSystem: {
      uri: "http://purl.obolibrary.org/obo/mondo.owl",
      oid: "2.16.840.1.113883.3.9216",
    },
    hgncGenesSystem: {
      uri: "http://www.genenames.org",
      oid: "2.16.840.1.113883.6.281",
    },
    hpoSystem: {
      uri: "http://human-phenotype-ontology.org",
      nonPreferredUri: "http://purl.obolibrary.org/obo/hp.owl",
    },
    isoCountrySystemUri: "urn:iso:std:iso:3166",
    snomedSystem: {
      uri: "http://snomed.info/sct",
      oid: "2.16.840.1.113883.6.96",
    },
    devTesting: isDevelopment
      ? {
          allowTestUsers: true,
          allowTestRoutes: true,
          sourceFrontEndDirect: true,
        }
      : undefined,
    branding: {
      brandName: _.get(config, "branding.brandName"),
      logoPath: logoPath,
      logoUriRelative: logoUriRelative,
    },
    datasets: _.get(config, "datasets"),
    superAdmins: _.get(config, "superAdmins"),
  };
}
