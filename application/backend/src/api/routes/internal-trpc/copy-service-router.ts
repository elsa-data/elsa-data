import { z } from "zod";
import { internalProcedure, router } from "../trpc-bootstrap";

const inputStepsExecutionArn = z.object({
  stepsExecutionArn: z.string(),
});

/**
 * RPC for functionality exposed by the copy service
 */
export const copyServiceRouter = router({
  getCopied: internalProcedure.query(async ({ input, ctx }) => {
    return ctx.copyService.getCopied();
  }),
  /* JUST FOR LOCAL DEMONSTRATION - DISABLED
  getCopiedReportHeader: internalProcedure
    .input(inputStepsExecutionArn)
    .query(async ({ input, ctx }) => {
      return ctx.copyService.getCopySummaryHeader(input.stepsExecutionArn);
    }),
  getCopiedReportRows: internalProcedure
    .input(inputStepsExecutionArn.merge(unorderedInputPaginationParameter))
    .query(async ({ input, ctx }) => {
      const { pageSize } = ctx;
      const { page = 1, stepsExecutionArn } = input;

      return await ctx.copyService.getCopySummaryRows(
        stepsExecutionArn,
        pageSize,
        calculateOffset(page, pageSize),
      );
    }),*/
});
