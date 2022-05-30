import Fastify, { FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import helmet from "@fastify/helmet";
import {
  locateHtmlDirectory,
  serveCustomIndexHtml,
  strictServeRealFileIfPresent,
} from "./app-helpers";
import { ElsaSettings } from "./bootstrap-settings";
import { generators } from "openid-client";
import { registerReleaseRoutes } from "./api/routes/release";
import { registerDatasetsRoutes } from "./api/routes/datasets";

export class App {
  public server: FastifyInstance;
  public serverEnvironment: "production" | "development";

  private readonly required_runtime_environment: string[] = [];
  private readonly optional_runtime_environment: string[] = [
    "SEMANTIC_VERSION",
    "BUILD_VERSION",
  ];

  // a absolute path to where static files are to be served from
  public staticFilesPath: string;

  constructor(private settings: ElsaSettings) {
    this.server = Fastify({ logger: true });
    this.serverEnvironment =
      process.env.NODE_ENV === "production" ? "production" : "development";

    // find where our website HTML is
    this.staticFilesPath = locateHtmlDirectory(this.serverEnvironment);

    // register global middleware/plugins
    this.server.register(fastifyStatic, {
      root: this.staticFilesPath,
      serve: false,
    });

    this.server.register(helmet, { contentSecurityPolicy: false });

    // inject the Elsa settings into every request (this is a shared immutable object)
    this.server.decorateRequest("settings", settings);

    registerReleaseRoutes(this.server);
    registerDatasetsRoutes(this.server);

    /*const client = new settings.oidcIssuer.Client({
      client_id: settings.oidcClientId,
      client_secret: settings.oidcClientSecret,
      redirect_uris: ["http://localhost:3000/cb"],
      response_types: ["code"],
      // id_token_signed_response_alg (default "RS256")
      // token_endpoint_auth_method (default "client_secret_basic")
    });

    const code_verifier = generators.codeVerifier();
    // store the code_verifier in your framework's session mechanism, if it is a cookie based solution
    // it should be httpOnly (not readable by javascript) and encrypted.

    const code_challenge = generators.codeChallenge(code_verifier);

    this.server.get("/login", async (request, reply) => {
      reply.redirect(
        client.authorizationUrl({
          scope: "openid email profile",
          // resource: 'https://my.api.example.com/resource/32178',
          code_challenge,
          code_challenge_method: "S256",
        })
      );
    });

    this.server.get("/cb", async (request, reply) => {
      const params = client.callbackParams(request.raw);

      const tokenSet = await client.callback(
        "http://localhost:3000/cb",
        params,
        { code_verifier }
      );

      console.log(tokenSet);

      reply.header("Hi", "There");
      reply.redirect("/");
    }); */

    // our behaviour for React routed websites is that NotFound responses might instead be replaced
    // with serving up index.html
    this.server.setNotFoundHandler(async (request, reply) => {
      // our react routes should never have file suffixes so we don't serve up index.html in those cases
      if (request.url.includes(".")) reply.status(404).send();
      else
        await serveCustomIndexHtml(
          reply,
          this.staticFilesPath,
          this.buildSafeEnvironment()
        );
    });

    this.server.get("*", async (request, reply) => {
      const requestPath = request.url;

      // we can short circuit out of any fancy handling if it is very explicit that they want the index
      if (requestPath === "/" || requestPath.endsWith("/index.html")) {
        return await serveCustomIndexHtml(
          reply,
          this.staticFilesPath,
          this.buildSafeEnvironment()
        );
      }

      if (requestPath === "/sockjs-node") {
        reply.status(404).send();
      } else {
        await strictServeRealFileIfPresent(reply, requestPath);
      }
    });
  }

  public getServer() {
    return this.server;
  }

  /**
   * Builds an environment dictionary that is whitelisted to known safe values using
   * whatever logic we want. This dictionary becomes the context for all HTML templating
   * - including a special data attribute that is used for injecting data into React.
   *
   * This can fetch values from any source we want
   * - environment variables passed in via CloudFormation
   * - secrets
   * - parameter store
   * - request variables
   *
   * @private
   */
  private buildSafeEnvironment(): { [id: string]: string } {
    const result: { [id: string]: string } = {};

    const addEnv = (key: string, required: boolean) => {
      const val = process.env[key];

      if (required && !val)
        throw new Error(
          `Our environment for index.html templating requires a variable named ${key}`
        );

      if (val) result[key.toLowerCase()] = val;
    };

    for (const k of this.required_runtime_environment) addEnv(k, true);
    for (const k of this.optional_runtime_environment) addEnv(k, false);

    let dataAttributes = "";

    const addAttribute = (k: string, v: string) => {
      if (!v)
        throw new Error(
          `The index.html generator must have access to a valid value to set for ${k}`
        );

      dataAttributes = dataAttributes + `\t\t${k}="${v}"\n`;
    };

    // these are env variables set in the solution deployment stack - probably via Cloud Formation parameters but also
    // locally they can be set just by shell env variables
    // Maps all the *deploy* time (stack) and *view* time (from browser fetching index.html)
    // environment data into data-attributes that will be
    // passed into the React app.
    addAttribute(
      "data-semantic-version",
      result.semantic_version || "undefined"
    );
    addAttribute("data-build-version", result.build_version || "unknown");
    addAttribute("data-deployed-environment", this.serverEnvironment);

    addAttribute("data-oidc-issuer", this.settings.oidcIssuer.metadata.issuer);
    addAttribute("data-oidc-client-id", this.settings.oidcClientId);
    // TODO: this is not meant to be passed to frontend.. needs PKCE enabled at OIDC endpoint first though
    addAttribute("data-oidc-client-secret", this.settings.oidcClientSecret);
    addAttribute("data-oidc-redirect-uri", "http://localhost:3000/cb");

    result["data_attributes"] = dataAttributes;

    return result;
  }
}
