import { FastifyInstance } from "fastify";
import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import {
  ReleaseAwsS3PresignRequestType,
  ReleaseCaseType,
  ReleaseDetailType,
  ReleaseSummaryType,
} from "@umccr/elsa-types";
import { authenticatedRouteOnEntryHelper } from "../api-routes";
import { Readable, Stream } from "stream";
import archiver, { ArchiverOptions } from "archiver";
import { stringify } from "csv-stringify";
import streamConsumers from "node:stream/consumers";
import { Base7807Error } from "../errors/_error.types";
import { container } from "tsyringe";
import { JobsService } from "../../business/services/jobs-service";
import { AwsService } from "../../business/services/aws-service";
import { ReleasesService } from "../../business/services/releases-service";

export function registerReleaseRoutes(fastify: FastifyInstance) {
  const jobsService = container.resolve(JobsService);
  const awsService = container.resolve(AwsService);
  const releasesService = container.resolve(ReleasesService);
  const edgeDbClient = container.resolve<edgedb.Client>("Database");

  fastify.get<{ Reply: ReleaseSummaryType[] }>(
    "/api/releases",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const allForUser = await releasesService.getAll(
        authenticatedUser,
        100,
        0
      );

      reply.send(allForUser);
    }
  );

  fastify.get<{ Params: { rid: string }; Reply: ReleaseDetailType }>(
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

  fastify.post<{ Params: { rid: string }; Reply: ReleaseDetailType }>(
    "/api/releases/:rid/jobs/select",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;

      reply.send(
        await jobsService.startSelectJob(authenticatedUser, releaseId)
      );
    }
  );

  fastify.post<{ Params: { rid: string }; Reply: ReleaseDetailType }>(
    "/api/releases/:rid/jobs/cancel",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;

      reply.send(
        await jobsService.cancelInProgressSelectJob(
          authenticatedUser,
          releaseId
        )
      );
    }
  );

  fastify.post<{
    Params: {
      rid: string;
      field: "diseases" | "countries";
      op: "add" | "remove";
    };
    Body: any;
  }>(
    "/api/releases/:rid/application-coded/:field/:op",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;
      const field = request.params.field;
      const op = request.params.op;
      const body = request.body;

      // we are pretty safe to add these fields together - even though they come from the user supplied route
      // if someone makes either field something unexpected - we'll fall through to the 400 reply
      switch (field + "-" + op) {
        case "diseases-add":
          reply.send(
            await releasesService.addDiseaseToApplicationCoded(
              authenticatedUser,
              releaseId,
              body.system,
              body.code
            )
          );
          return;
        case "diseases-remove":
          reply.send(
            await releasesService.removeDiseaseFromApplicationCoded(
              authenticatedUser,
              releaseId,
              body.system,
              body.code
            )
          );
          return;
        case "countries-add":
          reply.send(
            await releasesService.addCountryToApplicationCoded(
              authenticatedUser,
              releaseId,
              body.system,
              body.code
            )
          );
          return;
        case "countries-remove":
          reply.send(
            await releasesService.removeCountryFromApplicationCoded(
              authenticatedUser,
              releaseId,
              body.system,
              body.code
            )
          );
          return;
        case "type-set":
          if (body.type === "AWS")
            throw new Base7807Error(
              "Invalid research type",
              400,
              `The type ${body.type} is invalid`
            );
          reply.send(
            await releasesService.setTypeOfApplicationCoded(
              authenticatedUser,
              releaseId,
              body.type
            )
          );
          return;
        default:
          reply.status(400).send();
          return;
      }
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

    if (!awsService.isEnabled)
      throw new Error(
        "The AWS service was not started so no AWS signing will work"
      );

    const awsFiles = await awsService.getPresigned(
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
