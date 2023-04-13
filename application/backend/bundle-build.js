// General usage
const { build } = require("esbuild");
const esbuildPluginPino = require("esbuild-plugin-pino");

build({
  entryPoints: ["src/entrypoint.ts", "jobs/entrypoint-job-handler.ts"],
  external: ["sodium-native", "node-gyp-build"],
  bundle: true,
  outdir: "server/dist",
  platform: "node",
  minify: true,
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
  target: "node18",
}).catch(() => process.exit(1));
