// the bundler script to be used only for building the code in the Docker image
const { build } = require("esbuild");
const esbuildPluginPino = require("esbuild-plugin-pino");

build({
  platform: "node",
  target: "node18",
  entryPoints: ["src/entrypoint.ts", "jobs/entrypoint-job-handler.ts"],
  // NOTE these modules listed as externals must also be manually copied from the node_modules
  // in the actual Docker image building
  external: ["sodium-native", "node-gyp-build", "jsonpath"],
  bundle: true,
  // NOTE that this path gets built into some of the pino code so structurally
  // needs to be retained when running
  outdir: "server/dist",
  minify: false,
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
}).catch(() => process.exit(1));
