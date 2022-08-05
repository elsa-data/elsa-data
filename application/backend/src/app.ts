import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import fastifyStatic from "@fastify/static";
import fastifySecureSession from "@fastify/secure-session";
import fastifyFormBody from "@fastify/formbody";
import fastifyHelmet from "@fastify/helmet";
import {
  locateHtmlDirectory,
  serveCustomIndexHtml,
  strictServeRealFileIfPresent,
} from "./app-helpers";
import { ErrorHandler } from "./api/errors/_error.handler";
import { registerTestingRoutes } from "./api/routes/testing";
import { apiRoutes } from "./api/api-routes";
import { authRoutes, getSecureSessionOptions } from "./auth/auth-routes";
import { ElsaSettings } from "./config/elsa-settings";

export class App {
  public server: FastifyInstance;
  public serverEnvironment: "production" | "development";
  public serverLocation: "local" | "server";

  private readonly required_runtime_environment: string[] = [];
  private readonly optional_runtime_environment: string[] = [
    "SEMANTIC_VERSION",
    "BUILD_VERSION",
  ];

  private readonly settings: ElsaSettings;

  // a absolute path to where static files are to be served from
  public staticFilesPath: string;

  /**
   * Our constructor does all the setup that can be done without async/await
   * (increasingly almost nothing). It should check settings and establish
   * anything that cannot be changed.
   *
   * @param location whether this app is to be running local (i.e. localhost) or deployed
   * @param settingsGenerator a generator function for making copies of the settings
   */
  constructor(
    location: "local" | "server",
    settingsGenerator: () => ElsaSettings
  ) {
    this.serverEnvironment =
      process.env.NODE_ENV === "production" ? "production" : "development";

    // this is for determining whether we are running local dev or deployed dev
    // (it alters things like the use of SSL etc)
    this.serverLocation = location;

    if (
      this.serverLocation === "local" &&
      this.serverEnvironment !== "development"
    )
      throw new Error(
        "Cannot run anything other than a development server on local"
      );

    // find where our website HTML is
    this.staticFilesPath = locateHtmlDirectory(this.serverEnvironment);

    this.settings = settingsGenerator();

    this.server = Fastify({ logger: true });

    // inject a copy of the Elsa settings into every request
    this.server.decorateRequest("settings", null);
    this.server.addHook("onRequest", async (req, reply) => {
      (req as any).settings = settingsGenerator();
    });
  }

  public async setupServer(): Promise<FastifyInstance> {
    await this.server.register(fastifyFormBody);

    await this.server.register(fastifyHelmet, { contentSecurityPolicy: false });

    await this.server.register(fastifyStatic, {
      root: this.staticFilesPath,
      serve: false,
    });

    this.server.setErrorHandler(ErrorHandler);

    this.server.ready(() => {
      console.log(this.server.printRoutes({ commonPrefix: false }));
    });

    // TODO: compute the redirect URI from the deployment settings

    await this.server.register(
      fastifySecureSession,
      getSecureSessionOptions(this.settings)
    );

    this.server.register(apiRoutes, {
      allowTestCookieEquals:
        this.serverEnvironment === "development" ? "hello" : undefined,
    });

    this.server.register(authRoutes, {
      settings: this.settings,
      // TODO: need a better way for doing callback route discovery
      redirectUri:
        this.serverLocation === "local"
          ? "http://localhost:3000/cb"
          : "https://elsa.dev.umccr.org/cb",
      includeTestUsers: this.serverEnvironment === "development",
    });

    registerTestingRoutes(
      this.server,
      this.serverEnvironment === "development"
    );

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

    result["data_attributes"] = dataAttributes;

    return result;
  }
}
