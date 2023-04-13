// the bundler script to be used only for building the code in the Docker image
const { build } = require("esbuild");
const esbuildPluginPino = require("esbuild-plugin-pino");

build({
  platform: "node",
  target: "node18",
  entryPoints: ["src/entrypoint.ts", "jobs/entrypoint-job-handler.ts"],
  external: ["sodium-native", "node-gyp-build"],
  bundle: true,
  // NOTE that this path gets built into some of the pino code so structurally
  // needs to be retained when running
  outdir: "server/dist",
  minify: false,
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
}).catch(() => process.exit(1));
