import { FastifyInstance } from "fastify";
import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { ApplicationCodedTypeV1, ReleaseType } from "@umccr/elsa-types";
import { ElsaSettings } from "../../bootstrap-settings";

const client = edgedb.createClient();

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

      reply.send(allForUser);
    }
  );

  fastify.get<{ Params: { rid: string }; Reply: ReleaseType }>(
    "/api/releases/:rid",
    {},
    async function (request, reply) {
      const elsaSettings: ElsaSettings = (request as any).settings;

      const releaseId = request.params.rid;

      const thisRelease = await e
        .select(e.release.Release, (r) => ({
          id: true,
          datasetUris: true,
          applicationCoded: true,
          applicationDacIdentifier: true,
          applicationDacTitle: true,
          applicationDacDetails: true,
          filter: e.op(r.id, "=", e.uuid(releaseId)),
        }))
        .run(client);

      if (thisRelease != null)
        reply.send({
          id: thisRelease.id,
          applicationCoded:
            thisRelease.applicationCoded != null
              ? JSON.parse(thisRelease.applicationCoded)
              : {},
          datasetUris: thisRelease.datasetUris,
          applicationDacDetails: thisRelease.applicationDacDetails,
          applicationDacIdentifier: thisRelease.applicationDacIdentifier,
          applicationDacTitle: thisRelease.applicationDacTitle,
        });
    }
  );

  fastify.put<{ Params: { rid: string }; Request: ApplicationCodedTypeV1 }>(
    "/api/releases/:rid/application-coded",
    {},
    async function (request, reply) {
      const releaseId = request.params.rid;
      const newApplicationCoded = request.body;

      console.log(newApplicationCoded);

      const updateStatus = await e
        .update(e.release.Release, (r) => ({
          set: (r.applicationCoded = e.json(newApplicationCoded)),
          filter: e.op(r.id, "=", e.uuid(releaseId)),
        }))
        .run(client);

      console.log(updateStatus);

      reply.send("ok");
    }
  );
}
