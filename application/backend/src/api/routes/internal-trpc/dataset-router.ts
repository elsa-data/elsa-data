import { z } from "zod";
import { calculateOffset, internalProcedure, router } from "../trpc-bootstrap";
import { inputPaginationParameter } from "./input-schemas-common";

/**
 * RPC for release Datasets
 */
export const datasetRouter = router({
  getDataset: internalProcedure
    .input(
      inputPaginationParameter.merge(
        z.object({
          includeDeletedFile: z.boolean().optional(),
        })
      )
    )
    .query(async ({ input, ctx }) => {
      const { user, pageSize } = ctx;
      const { includeDeletedFile = false, page = 1 } = input;

      return await ctx.datasetService.getSummary(
        user,
        includeDeletedFile,
        pageSize,
        calculateOffset(page, pageSize)
      );
    }),
});
