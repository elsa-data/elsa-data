import type { FastifyInstance } from "fastify";
import type { DependencyContainer } from "tsyringe";
import { ManifestHtsgetStorageNotEnabled } from "../../../business/exceptions/manifest-htsget";
import { ManifestHtsgetService } from "../../../business/services/manifests/htsget/manifest-htsget-service";
import {
  ManifestHtsgetParamsSchema,
  type ManifestHtsgetParamsType,
  ManifestHtsgetQuerySchema,
  type ManifestHtsgetQueryType,
  ManifestHtsgetResponseSchema,
  type ManifestHtsgetResponseType,
} from "../../../business/services/manifests/htsget/manifest-htsget-types";
import { HtsgetAwsVpcLatticeAccessPointService } from "../../../business/services/sharers/htsget-aws-vpc-lattice-access-point/htsget-aws-vpc-lattice-access-point-service";
import { getServices } from "../../../di-helpers.ts";

export const manifestRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
  },
) => {
  const { logger, settings } = getServices(opts.container);
  const htsgetAwsVpcLatticeAccessPointService = opts.container.resolve(
    HtsgetAwsVpcLatticeAccessPointService,
  );

  // TODO note that we have not yet established a auth layer and so are unclear in what user
  //      context this work is happening
  fastify.get<{
    Params: ManifestHtsgetParamsType;
    Reply: ManifestHtsgetResponseType;
    Querystring: ManifestHtsgetQueryType;
  }>(
    "/manifest/htsget/:releaseKey",
    {
      schema: {
        params: ManifestHtsgetParamsSchema,
        response: {
          "2xx": ManifestHtsgetResponseSchema,
        },
        querystring: ManifestHtsgetQuerySchema,
      },
    },
    async function (request, reply) {
      if (request.query.type === "GCP" || request.query.type === "R2") {
        throw new ManifestHtsgetStorageNotEnabled();
      }

      const releaseKey = request.params.releaseKey;

      const manifestService = opts.container.resolve<ManifestHtsgetService>(
        request.query.type,
      );

      const output = await manifestService.publishHtsgetManifest(releaseKey);

      reply
        .header(
          "Cache-Control",
          `public, max-age=${output.maxAge}, must-revalidate, immutable`,
        )
        .send(output);
    },
  );

  /**
   * This is an integration with htsget-rs that sets up Elsa as a source of authorisation information
   * and sample mapping.
   */
  fastify.get("/integration/htsget-rs", {}, async function (request, reply) {
    const HTSGET_CONTEXT_ID_HEADER_NAME = "htsget-context-id";
    const HTSGET_CONTEXT_SOURCE_VPC_ARN_HEADER_NAME =
      "htsget-context-sourcevpcarn";

    // htsget-rs will pass this response all the way back to the client
    // this response format matches the htsget protocol
    const htsgetPermissionDeniedReply = (msg: string) => {
      reply.status(403).send({
        htsget: {
          error: "PermissionDenied",
          message: msg,
        },
      });
    };

    if (!(HTSGET_CONTEXT_ID_HEADER_NAME in request.headers)) {
      htsgetPermissionDeniedReply(
        `htsget Elsa-Data integration was missing required header ->${HTSGET_CONTEXT_ID_HEADER_NAME}<-`,
      );
      return;
    }

    if (!(HTSGET_CONTEXT_SOURCE_VPC_ARN_HEADER_NAME in request.headers)) {
      htsgetPermissionDeniedReply(
        `htsget Elsa-Data integration was missing required header ->${HTSGET_CONTEXT_SOURCE_VPC_ARN_HEADER_NAME}<-`,
      );
      return;
    }

    logger.info(request.headers, "Integration headers");

    const htsgetId = request.headers[HTSGET_CONTEXT_ID_HEADER_NAME];
    const htsgetSourceVpcArn =
      request.headers[HTSGET_CONTEXT_SOURCE_VPC_ARN_HEADER_NAME];

    if (
      typeof htsgetId !== "string" ||
      typeof htsgetSourceVpcArn !== "string"
    ) {
      htsgetPermissionDeniedReply(
        `htsget Elsa-Data integration headers must be strings`,
      );
      return;
    }

    const regexParts = [
      "arn:aws:ec2:",
      "(?<region_name>[^:]+?)", // group 1
      ":",
      "(?<account_id>\\d{12})", // group 2
      ":vpc\\/",
      "(?<vpc_id>[A-z0-9\\-]+?)", // group 3
      "$",
    ];

    const regex = new RegExp(regexParts.join(""));
    const regexGroups = regex.exec(htsgetSourceVpcArn)?.groups;
    const vpcId = regexGroups ? regexGroups["vpc_id"] : undefined;

    if (!vpcId) {
      htsgetPermissionDeniedReply(
        `htsget Elsa-Data integration not configured for this client`,
      );
      return;
    }

    let found = false;

    // we can do a very _quick_ simple check to make sure that the incoming VPC is mentioned
    // somewhere in the sharing settings - if not, then by definition we shouldn't be
    // sharing with them
    for (const s of settings.sharers) {
      if (s.type === "htsget-aws-vpc-lattice-access-point") {
        for (const [name, destination] of Object.entries(s.destinations)) {
          if (destination.vpcId === vpcId) {
            found = true;
          }
        }
      }
    }

    if (!found) {
      // if we are fielding requests from VPCs that are not even meant to be connected then we at least warn in our logs
      logger.warn(
        `htsget request from VPC ${vpcId} but no corresponding destination record for that VPC found`,
      );

      htsgetPermissionDeniedReply(
        `htsget Elsa-Data integration not configured for this client`,
      );
      return;
    }

    logger.info({ vpcId: vpcId }, `htsget integration request`);

    // TODO: at this point we have operated solely with internal config so this has been quick
    //       the next steps will make AWS calls or hit databases
    //       we should aggressively cache to make this not be a performance limit

    const parts = htsgetId.split("/");

    // find out information about the installed vpc lattice access point for the "release" signified in the id
    const installedInfo =
      parts.length > 0
        ? await htsgetAwsVpcLatticeAccessPointService.getInstalledHtsgetAwsVpcLatticeAccessPoint(
            parts[0],
          )
        : null;

    // give a vaguely generic msg here without being precise about why the id did not work
    if (!installedInfo) {
      htsgetPermissionDeniedReply(
        `htsget Elsa-Data integration not configured for ${parts[0]} and ${vpcId}`,
      );
      return;
    }

    if (vpcId !== installedInfo.vpcId) {
      // this is someone attempting to reach data they are not entitled to
      logger.warn(
        `htsget request from VPC ${vpcId} but release ${parts[0]} was configured for VPC ${installedInfo.vpcId}`,
      );

      htsgetPermissionDeniedReply(
        `htsget Elsa-Data integration not configured for ${parts[0]} and ${vpcId}`,
      );
      return;
    }

    const auth =
      await htsgetAwsVpcLatticeAccessPointService.getHtsgetVpcLatticeAccessPointAuthorisation(
        installedInfo,
        parts[0],
      );

    reply
      //.header(
      //  "Cache-Control",
      //  `public, max-age=${output.maxAge}, must-revalidate, immutable`,
      // )
      .send(auth);
  });
};

/**
 * Errors
 * The server MUST respond with an appropriate HTTP status code (4xx or 5xx) when an error condition is detected. In the case of transient server errors, (e.g., 503 and other 5xx status codes), the client SHOULD implement appropriate retry logic as discussed in Reliability & performance considerations below.
 *
 * For errors that are specific to the htsget protocol, the response body SHOULD be a JSON object (content-type application/json) providing machine-readable information about the nature of the error, along with a human-readable description. The structure of this JSON object is described as follows.
 *
 * Error Response JSON fields
 * htsget object
 *
 * Container for response object.
 *
 * error
 * string
 *
 * The type of error. This SHOULD be chosen from the list below.
 *
 * message
 * string
 *
 * A message specific to the error providing information on how to debug the problem. Clients MAY display this message to the user.
 *
 * The following errors types are defined:
 *
 * Error type	HTTP status code	Description
 * InvalidAuthentication	401	Authorization provided is invalid
 * PermissionDenied	403	Authorization is required to access the resource
 * NotFound	404	The resource requested was not found
 * PayloadTooLarge	413	POST request size is too large
 * UnsupportedFormat	400	The requested file format is not supported by the server
 * InvalidInput	400	The request parameters do not adhere to the specification
 * InvalidRange	400	The requested range cannot be satisfied
 * The error type SHOULD be chosen from this table and be accompanied by the specified HTTP status code. An example of a valid JSON error response is:
 *
 * {
 *    "htsget" : {
 *       "error": "NotFound",
 *       "message": "No such accession 'ENS16232164'"
 *    }
 * }
 */
