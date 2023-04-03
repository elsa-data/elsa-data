import { router, internalProcedure, calculateOffset } from "../trpc-bootstrap";
import {
  inputReleaseKeySingleParameter,
  inputPaginationParameter,
} from "./input-schemas-common";
import { sendPagedResult } from "../../api-internal-routes";

/**
 * TRPC for release Data Accessed Records
 */
export const releaseDataEgressRouter = router({
  dataEgressSummary: internalProcedure
    .input(inputPaginationParameter.merge(inputReleaseKeySingleParameter))
    .query(async ({ input, ctx }) => {
      const { user, pageSize, res: reply } = ctx;
      const { releaseKey, page = 1 } = input;

      return await ctx.releaseDataEgressService.getSummaryDataAccessAuditByReleaseKey(
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

      return await ctx.releaseDataEgressService.getDataAccessAuditByReleaseKey(
        user,
        releaseKey,
        pageSize,
        calculateOffset(page, pageSize)
      );
    }),
});
