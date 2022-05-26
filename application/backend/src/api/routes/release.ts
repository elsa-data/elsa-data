import { FastifyInstance } from "fastify";
import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { ReleaseType } from "@umccr/elsa-types";

const client = edgedb.createClient();

export function registerReleaseRoutes(fastify: FastifyInstance) {
  fastify.get<{ Reply: ReleaseType[] }>(
    "/api/releases",
    {},
    async function (request, reply) {
      const allForUser = await e
        .select(e.release.Release, (r) => ({
          ...e.release.Release["*"],
          datasets: true,
        }))
        .run(client);

      reply.send(allForUser);
    }
  );

  fastify.get<{ Params: { rid: string }; Reply: ReleaseType }>(
    "/api/releases/:rid",
    {},
    async function (request, reply) {
      const releaseId = request.params.rid;

      const thisRelease = await e
        .select(e.release.Release, (r) => ({
          id: true,
          datasets: {
            externalIdentifiers: true,
          },
          filter: e.op(r.id, "=", e.uuid(releaseId)),
        }))
        .run(client);

      if (thisRelease != null) reply.send(thisRelease);
    }
  );
}
