import { FastifyInstance } from "fastify";
import {
  DuoLimitationCodedType,
  ReleaseAwsS3PresignRequestSchema,
  ReleaseAwsS3PresignRequestType,
  ReleaseCaseType,
  ReleaseDetailType,
  ReleaseMasterAccessRequestType,
  ReleaseSummaryType,
} from "@umccr/elsa-types";
import {
  authenticatedRouteOnEntryHelper,
  sendPagedResult,
} from "../api-routes";
import { Base7807Error } from "../errors/_error.types";
import { container } from "tsyringe";
import { JobsService } from "../../business/services/jobs-service";
import { ReleaseService } from "../../business/services/release-service";
import { AwsAccessPointService } from "../../business/services/aws-access-point-service";
import { AwsPresignedUrlsService } from "../../business/services/aws-presigned-urls-service";

export const releaseRoutes = async (fastify: FastifyInstance) => {
  const jobsService = container.resolve(JobsService);
  const awsPresignedUrlsService = container.resolve(AwsPresignedUrlsService);
  const awsAccessPointService = container.resolve(AwsAccessPointService);
  const releasesService = container.resolve(ReleaseService);

  fastify.get<{ Reply: ReleaseSummaryType[] }>(
    "/api/releases",
    {},
    async function (request, reply) {
      const { authenticatedUser, pageSize, offset } =
        authenticatedRouteOnEntryHelper(request);

      const allForUser = await releasesService.getAll(
        authenticatedUser,
        pageSize,
        offset
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
      const { authenticatedUser, pageSize, page, q } =
        authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;

      const cases = await releasesService.getCases(
        authenticatedUser,
        releaseId,
        pageSize,
        (page - 1) * pageSize,
        q
      );

      sendPagedResult(reply, cases);
    }
  );

  fastify.get<{
    Params: { rid: string; nid: string };
    Reply: DuoLimitationCodedType[];
  }>("/api/releases/:rid/consent/:nid", {}, async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const releaseId = request.params.rid;
    const nodeId = request.params.nid;

    const r = await releasesService.getNodeConsent(
      authenticatedUser,
      releaseId,
      nodeId
    );

    console.log(r);

    reply.send(r);
  });

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

  // TODO: this probably should be a Graphql mutate endpoint rather than this hack..

  fastify.post<{
    Params: {
      rid: string;
      field: "diseases" | "countries" | "type" | "beacon";
      op: "add" | "remove" | "set";
    };
    Body: {
      type?: "HMB" | "DS" | "CC" | "GRU" | "POA";
      system?: string;
      code?: string;
      query?: any;
    };
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
              body.system!,
              body.code!
            )
          );
          return;
        case "diseases-remove":
          reply.send(
            await releasesService.removeDiseaseFromApplicationCoded(
              authenticatedUser,
              releaseId,
              body.system!,
              body.code!
            )
          );
          return;
        case "countries-add":
          reply.send(
            await releasesService.addCountryToApplicationCoded(
              authenticatedUser,
              releaseId,
              body.system!,
              body.code!
            )
          );
          return;
        case "countries-remove":
          reply.send(
            await releasesService.removeCountryFromApplicationCoded(
              authenticatedUser,
              releaseId,
              body.system!,
              body.code!
            )
          );
          return;
        case "type-set":
          // an example of error handling - to be removed
          if ((body.type as string) === "AWS")
            throw new Base7807Error(
              "Invalid research type",
              400,
              `The type ${body.type} is invalid`
            );
          reply.send(
            await releasesService.setTypeOfApplicationCoded(
              authenticatedUser,
              releaseId,
              body.type!
            )
          );
          return;
        case "beacon-set":
          reply.send(
            await releasesService.setBeaconQuery(
              authenticatedUser,
              releaseId,
              body.query!
            )
          );
          return;
        default:
          reply.status(400).send();
          return;
      }
    }
  );

  // /**
  //  * @param binary Buffer
  //  * returns readableInstanceStream Readable
  //  */
  // function bufferToStream(binary: Buffer) {
  //   return new Readable({
  //     read() {
  //       this.push(binary);
  //       this.push(null);
  //     },
  //   });
  // }

  fastify.post<{
    Body: ReleaseMasterAccessRequestType;
    Params: { rid: string };
  }>("/api/releases/:rid/access", {}, async function (request) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const releaseId = request.params.rid;

    await releasesService.setMasterAccess(
      authenticatedUser,
      releaseId,
      undefined, //isString(request.body.start) ? Date.parse(request.body.start) : request.body.start,
      undefined // request.body.end
    );
  });

  fastify.post<{
    Body: any;
    Params: { rid: string };
  }>("/api/releases/:rid/cfn", {}, async function (request) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const releaseId = request.params.rid;

    console.log(request.body);

    if (!awsPresignedUrlsService.isEnabled)
      throw new Error(
        "The AWS service was not started so AWS VPC sharing will not work"
      );

    await awsAccessPointService.installCloudFormationAccessPointForRelease(
      authenticatedUser,
      releaseId,
      ["831090136584"],
      "vpc-03d735d10b6cec468"
    );
  });

  // const PresignedT = Type.Object({
  //   header: Type.Array(Type.Union([Type.Literal("A"), Type.Literal("B")])),
  // });

  fastify.post<{
    Body: ReleaseAwsS3PresignRequestType;
    Params: { rid: string };
  }>(
    "/api/releases/:rid/aws-s3-presigned",
    {
      schema: {
        body: ReleaseAwsS3PresignRequestSchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;
      if (!awsPresignedUrlsService.isEnabled)
        throw new Error(
          "The AWS service was not started so AWS S3 presign will not work"
        );

      const presignResult = await awsPresignedUrlsService.getPresigned(
        authenticatedUser,
        releaseId,
        request.body.presignHeader
      );

      reply.raw.writeHead(200, {
        "Content-Disposition": `attachment; filename=${presignResult.filename}`,
        "Content-Type": "application/octet-stream",
      });

      presignResult.archive.pipe(reply.raw);
    }
  );
};
