import { Issuer } from "openid-client";
import { writeFile } from "fs/promises";
import * as temp from "temp";
import { ElsaSettings } from "./config/elsa-settings";
import { TransportMultiOptions } from "pino";
import _ from "lodash";

export async function bootstrapSettings(config: any): Promise<ElsaSettings> {
  // we now have our 'config' - which is the plain text values from all our configuration sources..
  // however our 'settings' are more than that - the settings involve things that need to be
  // constructed/discovered etc.
  // Settings might involve writing a cert file to disk and setting a corresponding env variable.
  // Settings might involve doing OIDC discovery and then using the returned value
  const issuer = await Issuer.discover(config.get("oidc.issuerUrl")!);

  const rootCa: string | undefined = config.get("edgeDb.tlsRootCa");

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

    await writeFile(rootCaLocation, rootCa);

    process.env["EDGEDB_TLS_CA_FILE"] = rootCaLocation;
  }

  // we are in dev *only* if it is made explicit
  const isDevelopment = process.env["NODE_ENV"] === "development";

  // we are prepared to default this to localhost
  let deployedUrl = `http://localhost:${config.get("port")}`;

  // but only if we are in dev and it is not set
  if (config.get("deployedUrl")) {
    deployedUrl = config.get("deployedUrl");
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

  let loggerTransportTargets: any[] = config.get("logger.transportTargets");

  // grab the targets from our config - but default to a sensible default that just logs to stdout
  // (if someone wants no logs they can set the level to silent)
  if (!_.isArray(loggerTransportTargets) || loggerTransportTargets.length < 1)
    loggerTransportTargets = [
      {
        target: "pino/file",
      },
    ];

  const logLevel = config.get("logger.level");

  if (logLevel) loggerTransportTargets.forEach((l) => (l.level ??= logLevel));

  const hasAws =
    config.has("aws.signingAccessKeyId") &&
    config.has("aws.signingSecretAccessKey") &&
    config.has("aws.tempBucket");
  const hasCloudflare =
    config.has("cloudflare.signingAccessKeyId") &&
    config.has("cloudflare.signingAccessKeyId");

  return {
    deployedUrl: deployedUrl,
    host: config.get("host"),
    port: config.get("port"),
    mailer: {
      mode: config.get("mailer.mode"),
      maxConnections: config.get("mailer.maxConnections"),
      sendingRate: config.get("mailer.sendingRate"),
      options: config.get("mailer.options"),
      defaults: config.get("mailer.defaults"),
    },
    oidcClientId: config.get("oidc.clientId")!,
    oidcClientSecret: config.get("oidc.clientSecret")!,
    oidcIssuer: issuer,
    aws: hasAws
      ? {
          signingAccessKeyId: config.get("aws.signingAccessKeyId")!,
          signingSecretAccessKey: config.get("aws.signingSecretAccessKey")!,
          tempBucket: config.get("aws.tempBucket")!,
        }
      : undefined,
    cloudflare: hasCloudflare
      ? {
          signingAccessKeyId: config.get("cloudflare.signingAccessKeyId"),
          signingSecretAccessKey: config.get("cloudflare.signingAccessKeyId"),
        }
      : undefined,
    sessionSecret: config.get("session.secret")!,
    sessionSalt: config.get("session.salt")!,
    remsBotKey: config.get("rems.botKey")!,
    remsBotUser: config.get("rems.botUser")!,
    remsUrl: "https://hgpp-rems.dev.umccr.org",
    logger: {
      name: "elsa-data",
      level: logLevel,
      transport: {
        targets: loggerTransportTargets,
      },
    },
    ontoFhirUrl: config.get("ontoFhirUrl"),
    maxmindDbAssetPath: config.get("maxmindDbAssetPath"),
    releaseKeyPrefix: config.get("releaseKeyPrefix"),
    mondoSystem: {
      uri: config.get("mondoSystem.uri"),
      oid: config.get("mondoSystem.oid"),
    },
    hgncGenesSystem: {
      uri: config.get("hgncGenesSystem.uri"),
      oid: config.get("hgncGenesSystem.oid"),
    },
    hpoSystem: {
      uri: config.get("hpoSystem.uri"),
      nonPreferredUri: config.get("hpoSystem.nonPreferredUri"),
    },
    isoCountrySystemUri: config.get("isoCountrySystemUri"),
    snomedSystem: {
      uri: config.get("snomedSystem.uri"),
      oid: config.get("snomedSystem.oid"),
    },
    rateLimit: {
      // for the moment we set up the rate limiting across the entire Elsa Data surface
      // (includes APIs and HTML/CSS fetches etc)
      global: true,
      max: config.get("rateLimit.max"),
      timeWindow: config.get("rateLimit.timeWindow"),
      allowList: config.get("rateLimit.allowList"),
    },
    devTesting: isDevelopment
      ? {
          allowTestUsers: true,
          allowTestRoutes: true,
          sourceFrontEndDirect: true,
        }
      : undefined,
    // these are our special arrays that can be constructed with + and - definitions
    datasets: (config.get("datasets") as any[]) ?? [],
    superAdmins: (config.get("superAdmins") as any[]) ?? [],
  };
}
