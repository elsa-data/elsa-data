import { readFile } from "fs/promises";
import { resolve } from "path";
import { FastifyReply } from "fastify";
import { template } from "lodash";
import { existsSync } from "fs";
import axios from "axios";
import * as fs from "fs";
import * as tar from "tar-stream";
import gunzip from "gunzip-maybe";
import { promisify } from "util";
import * as stream from "stream";

/**
 * Finds the location of the already built React/Vue/HTML website that we want to
 * be serving up. Handles relative locations of the files based on whether we
 * are in production or development mode.
 * Note: this function *cannot* be async (so it uses existsSync) because it runs in the constructor of
 * the web server.
 *
 * @param allowFilesDirectFromSource whether to allow sourcing files direct from the frontend build folders
 */
export function locateHtmlDirectory(allowFilesDirectFromSource: boolean) {
  // first look for the existence of a production distribution right in our own folder
  // this should only happen in Docker builds - but we will prefer this location
  // irrespective of whether we are in development or production
  let staticFilesPath = resolve("client", "dist");

  if (!existsSync(staticFilesPath)) {
    if (allowFilesDirectFromSource) {
      // ONLY IN DEVELOPMENT try looking for the build folder directly in our notWorking frontend dev area
      staticFilesPath = resolve("..", "frontend", "build");
    }
  }

  // we immediately discover (and abort) if our file structures are not set up
  // the way we expect with the matching frontend/ files
  const indexHtmlPath = resolve(staticFilesPath, "index.html");

  if (!existsSync(indexHtmlPath)) {
    throw Error(`No index.html file found where expected at ${indexHtmlPath}`);
  }

  return staticFilesPath;
}

/**
 * Serves up the frontend's index.html but does so with insertion of values known to the
 * server - that can then relay through to the React frontend. This is an exceedingly useful
 * pattern that helps us control the configuration of React - but from the backend deployment.
 *
 * @param reply
 * @param staticFilesPath
 * @param safeEnvironment
 */
export async function serveCustomIndexHtml(
  reply: FastifyReply,
  staticFilesPath: string,
  safeEnvironment: { [id: string]: string }
) {
  // the base index.html template (note: this index.html will *already* have been through a level of
  // templating during the create-react-app build phase - any further templating we are about to do
  // is to insert values that are from the *deployment* or *browser* context)
  let indexText = await readFile(
    resolve(staticFilesPath, "index.html"),
    "utf8"
  );

  // because it is very simple we are choosing to use the lodash template engine
  const compiled = template(indexText);

  indexText = compiled(safeEnvironment);

  // because our index.html is dynamically constructed (we use underlying env values + request header + geo locate etc)
  // we ensure that it is never cached (there is a distinction between no-cache and no-store - and apparently
  // no-cache is friendlier to browsers in general - and in our case will still force dynamic fetching - so that
  // is what we are going with)
  reply.header("Cache-Control", "no-cache");
  reply.type("text/html");
  reply.send(indexText);
}

/**
 * Tries to serve up any 'real' files that live in our configured static file path.
 *
 * @param reply
 * @param requestPath
 */
export async function strictServeRealFileIfPresent(
  reply: FastifyReply,
  requestPath: string
) {
  // we *attempt to send a file* but not being able to do it just means we need to serve up the
  // index.html
  // (this is needed to support React routing - where the React URL in a client browser can end up as
  //  "https://site.com/home/nested/blah"
  //  but if the user hits 'refresh' at that point - we still want to serve up the underlying index.html
  //  and then allow React routing to find the correct react page)
  await reply.sendFile(requestPath, {
    cacheControl: true,
    immutable: true,
    maxAge: "1d",
    lastModified: false,
    etag: false,
    // we don't want the send() code trying to locate index.html files, we will handle that
    index: false,
  });
}
