import { z } from "zod";
import { calculateOffset, internalProcedure, router } from "../trpc-bootstrap";
import { unorderedInputPaginationParameter } from "./input-schemas-common";

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
    }),
});
