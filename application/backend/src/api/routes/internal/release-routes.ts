import { FastifyInstance } from "fastify";
import {
  ReleaseManualSchema,
  ReleaseManualType,
  ReleasePatchOperationsSchema,
  ReleasePatchOperationsType,
} from "@umccr/elsa-types";
import { authenticatedRouteOnEntryHelper } from "../../api-internal-routes";
import { DependencyContainer } from "tsyringe";
import { ReleaseService } from "../../../business/services/releases/release-service";

/**
 * The release routes are legacy REST routes that have not yet been moved to TRPC.
 *
 * Consider moving them when we can.
 *
 * @param fastify
 * @param _opts
 */
export const releaseRoutes = async (
  fastify: FastifyInstance,
  _opts: { container: DependencyContainer },
) => {
  const releaseService = _opts.container.resolve(ReleaseService);

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
      const releaseKey = request.params.rid;

      if (request.body.length > 1)
        // the JSON patch standard says that all operations if more than 1 need to succeed/fail
        // so we would need transactions to achieve this
        // until we hit a need for it - we just disallow
        throw new Error(
          "Due to our services not having transaction support we don't allow multiple operations in one PATCH",
        );

      // as above - this is not really a for loop - this just deals with 1 PATCH operation - as all cases "return"
      for (const op of request.body) {
        switch (op.op) {
          case "add":
            switch (op.path) {
              case "/applicationCoded/diseases":
                reply.send(
                  await releaseService.addDiseaseToApplicationCoded(
                    authenticatedUser,
                    releaseKey,
                    op.value.system,
                    op.value.code,
                  ),
                );
                return;
              case "/applicationCoded/countries":
                reply.send(
                  await releaseService.addCountryToApplicationCoded(
                    authenticatedUser,
                    releaseKey,
                    op.value.system,
                    op.value.code,
                  ),
                );
                return;
              default:
                throw new Error(
                  `Unknown "add" operation path ${(op as any).path}`,
                );
            }

          case "remove":
            switch (op.path) {
              case "/applicationCoded/diseases":
                reply.send(
                  await releaseService.removeDiseaseFromApplicationCoded(
                    authenticatedUser,
                    releaseKey,
                    op.value.system,
                    op.value.code,
                  ),
                );
                return;
              case "/applicationCoded/countries":
                reply.send(
                  await releaseService.removeCountryFromApplicationCoded(
                    authenticatedUser,
                    releaseKey,
                    op.value.system,
                    op.value.code,
                  ),
                );
                return;
              default:
                throw new Error(
                  `Unknown "remove" operation path ${(op as any).path}`,
                );
            }

          case "replace":
            switch (op.path) {
              case "/applicationCoded/type":
                reply.send(
                  await releaseService.setTypeOfApplicationCoded(
                    authenticatedUser,
                    releaseKey,
                    op.value as any,
                  ),
                );
                return;
              case "/applicationCoded/beacon":
                reply.send(
                  await releaseService.setBeaconQuery(
                    authenticatedUser,
                    releaseKey,
                    op.value,
                  ),
                );
                return;
              case "/allowedRead":
                reply.send(
                  await releaseService.setIsAllowed(
                    authenticatedUser,
                    releaseKey,
                    "isAllowedReadData",
                    op.value,
                  ),
                );
                return;
              case "/allowedVariant":
                reply.send(
                  await releaseService.setIsAllowed(
                    authenticatedUser,
                    releaseKey,
                    "isAllowedVariantData",
                    op.value,
                  ),
                );
                return;
              case "/allowedPhenotype":
                reply.send(
                  await releaseService.setIsAllowed(
                    authenticatedUser,
                    releaseKey,
                    "isAllowedPhenotypeData",
                    op.value,
                  ),
                );
                return;
              case "/allowedS3":
                reply.send(
                  await releaseService.setIsAllowed(
                    authenticatedUser,
                    releaseKey,
                    "isAllowedS3Data",
                    op.value,
                  ),
                );
                return;
              case "/allowedGS":
                reply.send(
                  await releaseService.setIsAllowed(
                    authenticatedUser,
                    releaseKey,
                    "isAllowedGSData",
                    op.value,
                  ),
                );
                return;
              case "/allowedR2":
                reply.send(
                  await releaseService.setIsAllowed(
                    authenticatedUser,
                    releaseKey,
                    "isAllowedR2Data",
                    op.value,
                  ),
                );
                return;
              case "/dataSharingConfiguration/objectSigningEnabled":
              case "/dataSharingConfiguration/objectSigningExpiryHours":
              case "/dataSharingConfiguration/copyOutEnabled":
              case "/dataSharingConfiguration/copyOutDestinationLocation":
              case "/dataSharingConfiguration/htsgetEnabled":
              case "/dataSharingConfiguration/awsAccessPointEnabled":
              case "/dataSharingConfiguration/awsAccessPointName":
              case "/dataSharingConfiguration/gcpStorageIamEnabled":
              case "/dataSharingConfiguration/gcpStorageIamUsers":
                reply.send(
                  await releaseService.setDataSharingConfigurationField(
                    authenticatedUser,
                    releaseKey,
                    op.path,
                    op.value,
                  ),
                );
                return;
              default:
                throw new Error(
                  `Unknown "replace" operation path ${(op as any).path}`,
                );
            }
          default:
            throw new Error(`Unknown operation op ${(op as any).op}`);
        }
      }
    },
  );

  // POST for create new release via "Manual" DAC
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
      reply.send(await releaseService.new(authenticatedUser, request.body));
    },
  );

  /* TEMPORARILY DISABLED - NEED TO RE-ENABLE FOR A PRODUCTION GCS BUILD - BUT ALSO PROBABLY NEEDS TO BE MOVED TO BACKGROUND JOB

  const gcpStorageSharingService = _opts.container.resolve(
    GcpStorageSharingService,
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

      const releaseKey = request.params.rid;
      const users = request.body.users;

      reply.send(
        await gcpStorageSharingService.addUsers(
          authenticatedUser,
          releaseKey,
          users,
        ),
      );
    },
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

      const releaseKey = request.params.rid;
      const users = request.body.users;

      reply.send(
        await gcpStorageSharingService.deleteUsers(
          authenticatedUser,
          releaseKey,
          users,
        ),
      );
    },
  ); */
};
