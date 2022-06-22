import { FastifyInstance } from "fastify";
import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import {
  ApplicationCodedTypeV1,
  ReleaseAwsS3PresignRequestType,
  ReleaseCaseType,
  ReleaseType,
} from "@umccr/elsa-types";
import { ElsaSettings } from "../../bootstrap-settings";
import LinkHeader from "http-link-header";
import { releasesService } from "../../business/services/releases";
import { AuthenticatedUser } from "../../business/authenticated-user";
import { authenticatedRouteOnEntryHelper } from "../api-routes";
import { Readable } from "stream";
import { releasesAwsService } from "../../business/services/releases-aws";

const client = edgedb.createClient();

function mapDbToApi(
  dbObject: any,
  editSelections?: boolean,
  editApplicationCoded?: boolean
): ReleaseType {
  return {
    id: dbObject.id,
    datasetUris: dbObject.datasetUris,
    applicationDacIdentifier: dbObject?.applicationDacIdentifier,
    applicationDacTitle: dbObject?.applicationDacTitle,
    applicationDacDetails: dbObject?.applicationDacDetails,
    applicationCoded:
      dbObject.applicationCoded != null
        ? JSON.parse(dbObject.applicationCoded)
        : {},
    permissionEditSelections: editSelections,
    permissionEditApplicationCoded: editApplicationCoded,
    permissionAccessData: false,
  };
}

export function registerReleaseRoutes(fastify: FastifyInstance) {
  fastify.get<{ Reply: ReleaseType[] }>(
    "/api/releases",
    {},
    async function (request, reply) {
      const allForUser = await e
        .select(e.release.Release, (r) => ({
          ...e.release.Release["*"],
        }))
        .run(client);

      reply.send(allForUser.map((dbObject) => mapDbToApi(dbObject)));
    }
  );

  fastify.get<{ Params: { rid: string }; Reply: ReleaseType }>(
    "/api/releases/:rid",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;

      const release = await releasesService.get(authenticatedUser, releaseId);

      if (release) reply.send(release);
      else reply.status(400).send();
    }
  );

  fastify.get<{ Params: { rid: string }; Reply: ReleaseCaseType[] }>(
    "/api/releases/:rid/cases",
    {},
    async function (request, reply) {
      const { authenticatedUser, pageSize } =
        authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;

      const page = parseInt((request.query as any).page) || 0;

      const cases = await releasesService.getCases(
        authenticatedUser,
        releaseId,
        pageSize,
        page * pageSize
      );

      if (!cases) reply.status(400).send();
      else reply.send(cases.data);
    }
  );

  fastify.post<{ Body: string[]; Params: { rid: string }; Reply: string }>(
    "/api/releases/:rid/specimens/select",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;

      const specs: string[] = request.body;

      const setResult = await releasesService.setSelected(
        authenticatedUser,
        releaseId,
        specs
      );

      reply.send("ok");
    }
  );

  fastify.post<{ Body: string[]; Params: { rid: string }; Reply: string }>(
    "/api/releases/:rid/specimens/unselect",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;

      const specs: string[] = request.body;

      const unsetResult = await releasesService.setUnselected(
        authenticatedUser,
        releaseId,
        specs
      );

      reply.send("ok");
    }
  );

  fastify.put<{ Params: { rid: string }; Request: ApplicationCodedTypeV1 }>(
    "/api/releases/:rid/application-coded",
    {},
    async function (request, reply) {
      const releaseId = request.params.rid;
      const newApplicationCoded = request.body;

      console.log(newApplicationCoded);

      /*const updateStatus = await e
        .update(e.release.Release, (r) => ({
          set: (r.applicationCoded = e.json(newApplicationCoded)),
          filter: e.op(r.id, "=", e.uuid(releaseId)),
        }))
        .run(client);

      console.log(updateStatus); */

      reply.send("ok");
    }
  );

  fastify.post<{
    Body: ReleaseAwsS3PresignRequestType;
    Params: { rid: string };
  }>("/api/releases/:rid/pre-signed", {}, async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const releaseId = request.params.rid;

    console.log(
      await releasesAwsService.getPresigned(authenticatedUser, releaseId)
    );

    //const newApplicationCoded = request.body;

    //console.log(newApplicationCoded);

    const myStream = new Readable({
      read() {
        this.push("Hello");
        this.push(null);
      },
    });

    const response = myStream;

    reply.header("Content-Disposition", "attachment; filename=s3.txt");
    // reply.header('Content-Length', img.dataValues.Length);
    reply.type("application/octet-stream");
    reply.send(response);
  });
}
