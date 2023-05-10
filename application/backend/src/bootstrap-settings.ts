import { BaseClient, Issuer } from "openid-client";
import { writeFile } from "fs/promises";
import * as temp from "temp";
import { ElsaSettings } from "./config/elsa-settings";
import _ from "lodash";
import { ElsaConfiguration } from "./config/config-constants";

export async function bootstrapSettings(
  config: ElsaConfiguration
): Promise<ElsaSettings> {
  // we now have our 'config' - which is the plain text values from all our configuration sources..
  // however our 'settings' are more than that - the settings involve things that need to be
  // constructed/discovered etc.
  // Settings might involve writing a cert file to disk and setting a corresponding env variable.
  // Settings might involve doing OIDC discovery and then using the returned value

  const rootCa: string | undefined = config.edgeDb?.tlsRootCa;

  if (rootCa) {
    // edge db requires a TLS connection - and so we need to construct our own
    // TLS keys/ca. Here just the CA is needed by the client - but it must be
    // as a file on disk
    const rootCaLocation = temp.path();

    // We do not yet have a logger available at this point in the bootstrapper
    // So only enable this console logging if debugging the CA config
    // (in general this mechanism has been working well since initial implementation)
    //console.log(
    //  `Discovered TLS Root CA configuration so constructing CA on disk at ${rootCaLocation} and setting path in environment variable EDGEDB_TLS_CA_FILE`
    //);
    // console.log(rootCa);

    await writeFile(rootCaLocation, rootCa.replaceAll("\\n", "\n"));

    process.env["EDGEDB_TLS_CA_FILE"] = rootCaLocation;
  }

  // we are in dev *only* if it is made explicit
  const isDevelopment = process.env["NODE_ENV"] === "development";

  // we are prepared to default this to localhost
  let deployedUrl = `http://localhost:${config.port}`;
  let isLocalhost = true;

  // but only if we are in dev and it is not set
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

  let issuer: Issuer | undefined = undefined;

  if (_.has(config, "oidc")) {
    issuer = await Issuer.discover(config.oidc?.issuerUrl!);
  } else {
    if (!isDevelopment || !isLocalhost)
      throw new Error(
        "Only localhost development launches can exist without setting up an OIDC issuer"
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

  // TODO fix this logic once we have a few more AWS settings and know what is required
  const hasAws =
    config.aws?.signingAccessKeyId ||
    config.aws?.signingSecretAccessKey ||
    config.aws?.tempBucket;
  const hasAwsSigning =
    _.get(config, "aws.signingAccessKeyId") &&
    _.get(config, "aws.signingSecretAccessKey");
  const hasCloudflare =
    _.get(config, "cloudflare.signingAccessKeyId") &&
    _.get(config, "cloudflare.signingAccessKeyId");

  return {
    deployedUrl: deployedUrl,
    // this might eventually come from config but for the moment with only AWS is static
    serviceDiscoveryNamespace: "elsa-data",
    host: _.get(config, "host"),
    port: _.get(config, "port"),
    mailer: {
      mode: _.get(config, "mailer.mode"),
      maxConnections: _.get(config, "mailer.maxConnections"),
      sendingRate: _.get(config, "mailer.sendingRate"),
      options: _.get(config, "mailer.options"),
      defaults: _.get(config, "mailer.defaults"),
    },
    oidcClientId: _.get(config, "oidc.clientId")!,
    oidcClientSecret: _.get(config, "oidc.clientSecret")!,
    // NOTE this can be undefined for dev localhost - in which case any OIDC code paths will fail
    // but we expect that
    oidcIssuer: issuer!,
    htsget: _.get(config, "htsget.url")
      ? {
          maxAge: _.get(config, "htsget.maxAge"),
          url: new URL(_.get(config, "htsget.url")),
        }
      : undefined,
    aws: hasAws
      ? {
          signingAccessKeyId: hasAwsSigning
            ? _.get(config, "aws.signingAccessKeyId")
            : undefined,
          signingSecretAccessKey: hasAwsSigning
            ? _.get(config, "aws.signingSecretAccessKey")
            : undefined,
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
    sessionSecret: _.get(config, "session.secret")!,
    sessionSalt: _.get(config, "session.salt")!,
    dacs: _.get(config, "dacs"),
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
    rateLimit: {
      // for the moment we set up the rate limiting across the entire Elsa Data surface
      // (includes APIs and HTML/CSS fetches etc)
      global: true,
      max: _.get(config, "rateLimit.max"),
      timeWindow: _.get(config, "rateLimit.timeWindow"),
      allowList: _.get(config, "rateLimit.allowList"),
    },
    devTesting: isDevelopment
      ? {
          allowTestUsers: true,
          allowTestRoutes: true,
          sourceFrontEndDirect: true,
        }
      : undefined,
    // these are our special arrays that can be constructed with + and - definitions
    datasets: (config.datasets as any[]) ?? [],
    superAdmins: (config.superAdmins as any[]) ?? [],
  };
}
