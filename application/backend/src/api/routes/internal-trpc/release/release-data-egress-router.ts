import {
  calculateOffset,
  internalProcedure,
  router,
} from "../../trpc-bootstrap";
import {
  inputPaginationParameter,
  inputReleaseKeySingle,
} from "../input-schemas-common";

/**
 * RPC for release Data Egress Records
 */
export const releaseDataEgressRouter = router({
  updateDataEgressRecord: internalProcedure
    .input(inputReleaseKeySingle)
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const { releaseKey } = input;
      await ctx.releaseDataEgressService.syncDataEgressByReleaseKey(
        user,
        releaseKey
      );
    }),
  dataEgressSummary: internalProcedure
    .input(inputPaginationParameter.merge(inputReleaseKeySingle))
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
    .input(inputPaginationParameter.merge(inputReleaseKeySingle))
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
