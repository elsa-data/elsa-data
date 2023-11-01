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
  getConfiguredDatasets: internalProcedure.query(async ({ input, ctx }) => {
    const { user } = ctx;

    return ctx.datasetService.getConfigured(user);
  }),
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
      return await ctx.datasetService.get(user, datasetUri, includeDeletedFile);
    }),
  getDatasetConsent: internalProcedure
    .input(
      z.object({
        consentId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx;
      const { consentId } = input;

      return await ctx.datasetService.getDatasetsConsent(user, consentId);
    }),
});
