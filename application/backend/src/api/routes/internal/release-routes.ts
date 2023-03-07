import { FastifyInstance } from "fastify";
import {
  DuoLimitationCodedType,
  ReleasePresignRequestSchema,
  ReleasePresignRequestType,
  ReleaseCaseType,
  ReleaseManualSchema,
  ReleaseManualType,
  ReleaseMasterAccessRequestType,
  ReleasePatchOperationsSchema,
  ReleasePatchOperationsType,
  ReleaseSummaryType,
  ReleaseParticipantType,
  ReleaseParticipantAddType,
  ReleaseDetailType,
} from "@umccr/elsa-types";
import {
  authenticatedRouteOnEntryHelper,
  sendPagedResult,
} from "../../api-internal-routes";
import { container } from "tsyringe";
import { JobsService } from "../../../business/services/jobs/jobs-base-service";
import { ReleaseService } from "../../../business/services/release-service";
import { AwsAccessPointService } from "../../../business/services/aws-access-point-service";
import { GcpStorageSharingService } from "../../../business/services/gcp-storage-sharing-service";
import { PresignedUrlsService } from "../../../business/services/presigned-urls-service";
import { ReleaseParticipationService } from "../../../business/services/release-participation-service";

export const releaseRoutes = async (fastify: FastifyInstance) => {
  const jobsService = container.resolve(JobsService);
  const presignedUrlsService = container.resolve(PresignedUrlsService);
  const awsAccessPointService = container.resolve(AwsAccessPointService);
  const gcpStorageSharingService = container.resolve(GcpStorageSharingService);
  const releasesService = container.resolve(ReleaseService);
  const releaseParticipantService = container.resolve(
    ReleaseParticipationService
  );

  fastify.get<{ Reply: ReleaseSummaryType[] }>(
    "/releases",
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
    "/releases/:rid",
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
    "/releases/:rid/cases",
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

  fastify.get<{ Params: { rid: string }; Reply: ReleaseParticipantType[] }>(
    "/releases/:rid/participants",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;

      const participants = await releaseParticipantService.getParticipants(
        authenticatedUser,
        releaseId
      );

      return participants.map(
        (r): ReleaseParticipantType => ({
          id: r.id,
          email: r.email,
          role: r.role || "None",
          displayName: r.displayName || r.email,
          subjectId: r.subjectId || undefined,
          lastLogin: r.lastLogin || undefined,
          // WIP - also need to check permissions of authenticatedUser
          canBeRemoved: r.id !== authenticatedUser.dbId,
          canBeRoleAltered: r.id !== authenticatedUser.dbId,
        })
      );
    }
  );

  fastify.post<{
    Params: { rid: string };
    Body: ReleaseParticipantAddType;
    Reply: void;
  }>("/releases/:rid/participants", {}, async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const releaseUuid = request.params.rid;

    return releaseParticipantService.addParticipant(
      authenticatedUser,
      releaseUuid,
      request.body.email,
      request.body.role
    );
  });

  fastify.delete<{ Params: { rid: string; pid: string }; Reply: void }>(
    "/releases/:rid/participants/:pid",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;
      const participantUuid = request.params.pid;

      return releaseParticipantService.removeParticipant(
        authenticatedUser,
        releaseId,
        participantUuid
      );
    }
  );

  fastify.get<{
    Params: { rid: string; nid: string };
    Reply: DuoLimitationCodedType[];
  }>("/releases/:rid/consent/:nid", {}, async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const releaseId = request.params.rid;
    const nodeId = request.params.nid;

    const r = await releasesService.getNodeConsent(
      authenticatedUser,
      releaseId,
      nodeId
    );

    request.log.debug(r);

    reply.send(r);
  });

  fastify.post<{ Params: { rid: string }; Reply: ReleaseDetailType }>(
    "/releases/:rid/jobs/select",
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
    "/releases/:rid/jobs/cancel",
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

  /**
   * The main route for altering fields in a release. Normally the UI component for the
   * field is tied to a mutator which makes the corresponding patch operation.
   */
  fastify.patch<{
    Params: {
      rid: string;
    };
    Body: ReleasePatchOperationsType;
  }>(
    "/releases/:rid",
    {
      schema: {
        body: ReleasePatchOperationsSchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);
      const releaseId = request.params.rid;

      if (request.body.length > 1)
        // the JSON patch standard says that all operations if more than 1 need to succeed/fail
        // so we would need transactions to achieve this
        // until we hit a need for it - we just disallow
        throw new Error(
          "Due to our services not having transaction support we don't allow multiple operations in one PATCH"
        );

      for (const op of request.body) {
        switch (op.op) {
          case "add":
            switch (op.path) {
              case "/specimens":
                reply.send(
                  await releasesService.setSelected(
                    authenticatedUser,
                    releaseId,
                    op.value
                  )
                );
                return;
              case "/applicationCoded/diseases":
                reply.send(
                  await releasesService.addDiseaseToApplicationCoded(
                    authenticatedUser,
                    releaseId,
                    op.value.system,
                    op.value.code
                  )
                );
                return;
              case "/applicationCoded/countries":
                reply.send(
                  await releasesService.addCountryToApplicationCoded(
                    authenticatedUser,
                    releaseId,
                    op.value.system,
                    op.value.code
                  )
                );
                return;
              default:
                throw new Error(
                  `Unknown "add" operation path ${(op as any).path}`
                );
            }

          case "remove":
            switch (op.path) {
              case "/specimens":
                reply.send(
                  await releasesService.setUnselected(
                    authenticatedUser,
                    releaseId,
                    op.value
                  )
                );
                return;
              case "/applicationCoded/diseases":
                reply.send(
                  await releasesService.removeDiseaseFromApplicationCoded(
                    authenticatedUser,
                    releaseId,
                    op.value.system,
                    op.value.code
                  )
                );
                return;
              case "/applicationCoded/countries":
                reply.send(
                  await releasesService.removeCountryFromApplicationCoded(
                    authenticatedUser,
                    releaseId,
                    op.value.system,
                    op.value.code
                  )
                );
                return;
              default:
                throw new Error(
                  `Unknown "remove" operation path ${(op as any).path}`
                );
            }

          case "replace":
            switch (op.path) {
              case "/applicationCoded/type":
                reply.send(
                  await releasesService.setTypeOfApplicationCoded(
                    authenticatedUser,
                    releaseId,
                    op.value as any
                  )
                );
                return;
              case "/applicationCoded/beacon":
                reply.send(
                  await releasesService.setBeaconQuery(
                    authenticatedUser,
                    releaseId,
                    op.value
                  )
                );
                return;
              case "/allowedRead":
                reply.send(
                  await releasesService.setIsAllowed(
                    authenticatedUser,
                    releaseId,
                    "read",
                    op.value
                  )
                );
                return;
              case "/allowedVariant":
                reply.send(
                  await releasesService.setIsAllowed(
                    authenticatedUser,
                    releaseId,
                    "variant",
                    op.value
                  )
                );
                return;
              case "/allowedPhenotype":
                reply.send(
                  await releasesService.setIsAllowed(
                    authenticatedUser,
                    releaseId,
                    "phenotype",
                    op.value
                  )
                );
                return;
              default:
                throw new Error(
                  `Unknown "replace" operation path ${(op as any).path}`
                );
            }
          default:
            throw new Error(`Unknown operation op ${(op as any).op}`);
        }
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
  }>("/releases/:rid/access", {}, async function (request) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const releaseId = request.params.rid;

    await releasesService.setMasterAccess(
      authenticatedUser,
      releaseId,
      undefined, //isString(request.body.start) ? Date.parse(request.body.start) : request.body.start,
      undefined // request.body.end
    );
  });

  fastify.get<{
    Params: { rid: string };
  }>("/releases/:rid/cfn", {}, async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const releaseId = request.params.rid;

    if (!awsAccessPointService.isEnabled)
      throw new Error(
        "The AWS service was not started so AWS VPC sharing will not work"
      );

    const res = await awsAccessPointService.getInstalledAccessPointResources(
      authenticatedUser,
      releaseId
    );

    reply.send(res);
  });

  fastify.post<{
    Body: { accounts: string[]; vpcId?: string };
    Params: { rid: string };
  }>("/releases/:rid/cfn", {}, async function (request) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const releaseId = request.params.rid;

    if (!awsAccessPointService.isEnabled)
      throw new Error(
        "The AWS service was not started so AWS VPC sharing will not work"
      );

    const s3HttpsUrl =
      await awsAccessPointService.createAccessPointCloudFormationTemplate(
        authenticatedUser,
        releaseId,
        request.body.accounts,
        request.body.vpcId
      );

    await jobsService.startCloudFormationInstallJob(
      authenticatedUser,
      releaseId,
      s3HttpsUrl
    );
  });

  // const PresignedT = Type.Object({
  //   header: Type.Array(Type.Union([Type.Literal("A"), Type.Literal("B")])),
  // });

  fastify.post<{
    Body: ReleasePresignRequestType;
    Params: { rid: string };
  }>(
    "/releases/:rid/presigned",
    {
      schema: {
        body: ReleasePresignRequestSchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;
      if (!presignedUrlsService.isEnabled)
        throw new Error(
          "The presigned URLs service was not started so URL presigning will " +
            "not work"
        );

      const presignResult = await presignedUrlsService.getPresigned(
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

  fastify.post<{
    Body: ReleasePresignRequestType;
    Params: { rid: string };
  }>(
    "/releases/:rid/cfn/manifest",
    {
      schema: {
        body: ReleasePresignRequestSchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;
      if (!awsAccessPointService.isEnabled)
        throw new Error(
          "The AWS service was not started so AWS S3 Access Points will not work"
        );

      const accessPointTsv = await awsAccessPointService.getAccessPointFileList(
        authenticatedUser,
        releaseId,
        request.body.presignHeader
      );

      reply.header(
        "Content-disposition",
        `attachment; filename=${accessPointTsv.filename}`
      );
      reply.type("text/tab-separated-values");
      reply.send(accessPointTsv.content);
    }
  );

  fastify.post<{
    Body: ReleaseManualType;
    Reply: string;
  }>(
    "/release",
    {
      schema: {
        body: ReleaseManualSchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);
      reply.send(await releasesService.new(authenticatedUser, request.body));
    }
  );

  fastify.post<{
    Params: { rid: string };
    Body: { users: string[] };
    Reply: number;
  }>(
    "/releases/:rid/gcp-storage/acls/add",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      if (!gcpStorageSharingService.isEnabled)
        throw new Error(
          "The GCP storage sharing service was not started so object sharing will not work"
        );

      const releaseId = request.params.rid;
      const users = request.body.users;

      reply.send(
        await gcpStorageSharingService.addUsers(
          authenticatedUser,
          releaseId,
          users
        )
      );
    }
  );

  fastify.post<{
    Params: { rid: string };
    Body: { users: string[] };
    Reply: number;
  }>(
    "/releases/:rid/gcp-storage/acls/remove",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      if (!gcpStorageSharingService.isEnabled)
        throw new Error(
          "The GCP storage sharing service was not started so object sharing will not work"
        );

      const releaseId = request.params.rid;
      const users = request.body.users;

      reply.send(
        await gcpStorageSharingService.deleteUsers(
          authenticatedUser,
          releaseId,
          users
        )
      );
    }
  );

  fastify.get<{
    Body: ReleasePresignRequestType;
    Params: { rid: string };
  }>(
    "/releases/:rid/gcp-storage/acls/manifest",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      if (!gcpStorageSharingService.isEnabled)
        throw new Error(
          "The GCP storage sharing service was not started so object sharing will not work"
        );

      const releaseId = request.params.rid;

      const manifest = await gcpStorageSharingService.manifest(
        authenticatedUser,
        releaseId,
        request.body.presignHeader
      );

      reply.header(
        "Content-disposition",
        `attachment; filename=${manifest.filename}`
      );
      reply.type("text/tab-separated-values");
      reply.send(manifest.content);
    }
  );
};
