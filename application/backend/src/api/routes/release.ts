import { FastifyInstance } from "fastify";
import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import {
  ReleaseAwsS3PresignRequestType,
  ReleaseCaseType,
  ReleaseType,
} from "@umccr/elsa-types";
import { releasesService } from "../../business/services/releases";
import { authenticatedRouteOnEntryHelper } from "../api-routes";
import { Readable, Stream } from "stream";
import { releasesAwsService } from "../../business/services/releases-aws";
import archiver, { ArchiverOptions } from "archiver";
import { stringify } from "csv-stringify";
import streamConsumers from "node:stream/consumers";

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

  fastify.post<{
    Params: {
      rid: string;
      field: "diseases" | "countries";
      op: "add" | "remove";
    };
    Body: { system: string; code: string };
  }>(
    "/api/releases/:rid/application-coded/:field/:op",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;
      const field = request.params.field;
      const op = request.params.op;

      if (op !== "add" && op !== "remove") {
        reply.status(400).send();
        return;
      }

      const { system, code } = request.body;

      switch (field) {
        case "diseases":
          if (op === "add")
            await releasesService.addDiseaseToApplicationCoded(
              authenticatedUser,
              releaseId,
              system,
              code
            );
          else
            await releasesService.removeDiseaseFromApplicationCoded(
              authenticatedUser,
              releaseId,
              system,
              code
            );
          break;
        case "countries":
          if (op === "add")
            await releasesService.addCountryToApplicationCoded(
              authenticatedUser,
              releaseId,
              system,
              code
            );
          else
            await releasesService.removeCountryFromApplicationCoded(
              authenticatedUser,
              releaseId,
              system,
              code
            );
          break;
        default:
          reply.status(400).send();
          return;
      }

      reply.send("ok");
    }
  );

  /**
   * @param binary Buffer
   * returns readableInstanceStream Readable
   */
  function bufferToStream(binary: Buffer) {
    return new Readable({
      read() {
        this.push(binary);
        this.push(null);
      },
    });
  }

  fastify.post<{
    Body: ReleaseAwsS3PresignRequestType;
    Params: { rid: string };
  }>("/api/releases/:rid/pre-signed", {}, async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const releaseId = request.params.rid;

    const awsFiles = await releasesAwsService.getPresigned(
      authenticatedUser,
      releaseId
    );

    if (!awsFiles) throw new Error("Could not pre-sign S3 URLs");

    const stringifier = stringify({
      header: true,
      columns: [
        { key: "s3", header: "S3" },
        { key: "fileType", header: "FILETYPE" },
        { key: "md5", header: "MD5" },
        { key: "size", header: "SIZE" },
        { key: "caseId", header: "CASEID" },
        { key: "patientId", header: "PATIENTID" },
        { key: "specimenId", header: "SPECIMENID" },
        { key: "s3Signed", header: "S3SIGNED" },
      ],
      delimiter: "\t",
    });

    const readableStream = Readable.from(awsFiles);

    const buf = await streamConsumers.text(readableStream.pipe(stringifier));

    // create archive and specify method of encryption and password
    let archive = archiver.create("zip-encrypted", {
      zlib: { level: 8 },
      encryptionMethod: "aes256",
      password: "123",
    } as ArchiverOptions);

    archive.append(buf, { name: "files.tsv" });

    await archive.finalize();

    reply.raw.writeHead(200, {
      "Content-Disposition": "attachment; filename=releaseXYZ.zip",
      "Content-Type": "application/octet-stream",
    });

    archive.pipe(reply.raw);
  });
}
