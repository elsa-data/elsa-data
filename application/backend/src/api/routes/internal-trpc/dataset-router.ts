import { z } from "zod";
import { calculateOffset, internalProcedure, router } from "../trpc-bootstrap";
import { inputPaginationParameter } from "./input-schemas-common";

/**
 * Defining a of zod input construct
 */
const inputIncludeDeletedFile = z.object({
  includeDeletedFile: z.boolean().optional(),
});
const inputSingleDatasetUri = z.object({
  datasetUri: z.string(),
});

/**
 * RPC for Datasets
 */
export const datasetRouter = router({
  getAllDataset: internalProcedure
    .input(inputPaginationParameter)
    .query(async ({ input, ctx }) => {
      const { user, pageSize } = ctx;
      const { page = 1 } = input;

      return await ctx.datasetService.getAll({
        user,
        limit: pageSize,
        offset: calculateOffset(page, pageSize),
      });
    }),
  getSingleDataset: internalProcedure
    .input(inputIncludeDeletedFile.merge(inputSingleDatasetUri))
    .query(async ({ input, ctx }) => {
      const { user } = ctx;
      const { datasetUri, includeDeletedFile = false } = input;

      return await ctx.datasetService.get({
        user,
        includeDeletedFile,
        datasetUri,
      });
    }),
  updateDataset: internalProcedure
    .input(inputSingleDatasetUri)
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const { datasetUri } = input;

      // TODO: Support more import method accordingly
      // TODO: Some error when datasetUri not found
      await ctx.agS3IndexService.syncDbFromDatasetUri(datasetUri, user);
    }),
  getDatasetConsent: internalProcedure
    .input(
      z.object({
        consentId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx;
      const { consentId } = input;

      return await ctx.datasetService.getDatasetsConsent(user, consentId);
    }),
  updateGen3Sync: internalProcedure
    .input(
      z.object({
        uri: z.string(),
        gen3Url: z.string(),
        gen3Bearer: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx;
      const { uri, gen3Url, gen3Bearer } = input;

      // WIP

      // if (!datasetGen3SyncRequestValidate(request.body)) {
      //   //reply
      //   //    .code(200)
      //   //    .header('Content-Type', 'application/json; charset=utf-8')
      //   //    .send({ hello: 'world' })

      //   reply.send({
      //     error: datasetGen3SyncRequestValidate.errors?.join(" "),
      //   });
      // }

      // reply.send({
      //   error: undefined,
      // });

      return new Error();
    }),
});
