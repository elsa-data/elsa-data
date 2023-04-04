import { calculateOffset, internalProcedure, router } from "../trpc-bootstrap";
import {
  inputPaginationParameter,
  inputReleaseKeySingleParameter,
} from "./input-schemas-common";

/**
 * TRPC for release Data Accessed Records
 */
export const releaseDataEgressRouter = router({
  syncDataEgress: internalProcedure
    .input(inputReleaseKeySingleParameter)
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const { releaseKey } = input;
      await ctx.releaseDataEgressService.syncDataEgressByReleaseKey(
        user,
        releaseKey
      );
    }),
  dataEgressSummary: internalProcedure
    .input(inputPaginationParameter.merge(inputReleaseKeySingleParameter))
    .query(async ({ input, ctx }) => {
      const { user, pageSize, res: reply } = ctx;
      const { releaseKey, page = 1 } = input;

      return await ctx.releaseDataEgressService.getSummaryDataEgressByReleaseKey(
        user,
        releaseKey,
        pageSize,
        calculateOffset(page, pageSize)
      );
    }),
  dataEgressRecords: internalProcedure
    .input(inputPaginationParameter.merge(inputReleaseKeySingleParameter))
    .query(async ({ input, ctx }) => {
      const { user, pageSize, res: reply } = ctx;
      const { releaseKey, page = 1 } = input;

      return await ctx.releaseDataEgressService.getDataEgressRecordsByReleaseKey(
        user,
        releaseKey,
        pageSize,
        calculateOffset(page, pageSize)
      );
    }),
});
