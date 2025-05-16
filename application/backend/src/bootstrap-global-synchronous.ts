import archiver from "archiver";
import i18n from "i18n";
import { join } from "node:path";

/**
 * A location for any synchronous setup that
 * - is common across all envs/locations
 * - is synchronous
 * - must only be performed globally once per process/node
 */
export function bootstrapGlobalSynchronous() {
  // register format for archiver
  // note: only do it once per Node.js process/application, as duplicate registration will throw an error
  archiver.registerFormat("zip-encrypted", require("archiver-zip-encrypted"));

  // translations - its possible this may need to move *post* settings in order to discover default locale
  // for the moment it is ok here
  i18n.configure({
    locales: ["en"],
    defaultLocale: "en",
    queryParameter: "lang",
    directory: join("./", "locales"),
    api: {
      __: "translate",
      __n: "translateN",
    },
  });
}
