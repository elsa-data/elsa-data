import { Issuer } from "openid-client";
import { writeFile } from "fs/promises";
import * as temp from "temp";
import { ElsaSettings } from "./config/elsa-settings";

export async function bootstrapSettings(config: any): Promise<ElsaSettings> {
  console.log("The raw configuration found is");
  console.log(config.toString());

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

    console.log(
      `Discovered TLS Root CA configuration so constructing CA on disk at ${rootCaLocation} and setting path in environment variable EDGEDB_TLS_CA_FILE`
    );
    console.log(rootCa);

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
    awsSigningAccessKeyId: config.get("aws.signingAccessKeyId")!,
    awsSigningSecretAccessKey: config.get("aws.signingSecretAccessKey")!,
    awsTempBucket: config.get("aws.tempBucket")!,
    sessionSecret: config.get("session.secret")!,
    sessionSalt: config.get("session.salt")!,
    remsBotKey: config.get("rems.botKey")!,
    remsBotUser: config.get("rems.botUser")!,
    remsUrl: "https://hgpp-rems.dev.umccr.org",
    ontoFhirUrl: config.get("ontoFhirUrl"),
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
    datasets: (config.get("datasets") as any[]) ?? [],
    superAdmins: (config.get("superAdmins") as any[]) ?? [],
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
  };
}
