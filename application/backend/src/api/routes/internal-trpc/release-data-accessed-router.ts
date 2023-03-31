import { router, internalProcedure, calculateOffset } from "../trpc-bootstrap";
import {
  inputReleaseKeySingleParameter,
  inputPaginationParameter,
} from "./input-schemas-common";
import { sendPagedResult } from "../../api-internal-routes";

/**
 * TRPC for release Data Accessed Records
 */
export const releaseDataAccessedRouter = router({
  dataAccessedSummary: internalProcedure
    .input(inputPaginationParameter.merge(inputReleaseKeySingleParameter))
    .query(async ({ input, ctx }) => {
      const { user, pageSize, res: reply } = ctx;
      const { releaseKey, page = 1 } = input;

      return await ctx.releaseDataAccessedService.getSummaryDataAccessAuditByReleaseKey(
        user,
        releaseKey,
        pageSize,
        calculateOffset(page, pageSize)
      );
    }),
  dataAccessedRecords: internalProcedure
    .input(inputPaginationParameter.merge(inputReleaseKeySingleParameter))
    .query(async ({ input, ctx }) => {
      const { user, pageSize, res: reply } = ctx;
      const { releaseKey, page = 1 } = input;

      return await ctx.releaseDataAccessedService.getDataAccessAuditByReleaseKey(
        user,
        releaseKey,
        pageSize,
        calculateOffset(page, pageSize)
      );
    }),
});
