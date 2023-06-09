import { z } from "zod";
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
 * RPC for release
 */
export const releaseRouter = router({
  getAllRelease: internalProcedure
    .input(inputPaginationParameter)
    .query(async ({ input, ctx }) => {
      const { user, pageSize } = ctx;
      const { page = 1 } = input;

      return await ctx.releaseService.getAll(
        user,
        pageSize,
        calculateOffset(page, pageSize)
      );
    }),
  getSpecificRelease: internalProcedure
    .input(inputReleaseKeySingle)
    .query(async ({ input, ctx }) => {
      const { user } = ctx;
      const { releaseKey } = input;

      return await ctx.releaseService.get(user, releaseKey);
    }),
  getReleaseConsent: internalProcedure
    .input(inputReleaseKeySingle.merge(z.object({ nodeId: z.string() })))
    .query(async ({ input, ctx }) => {
      const { user } = ctx;
      const { releaseKey, nodeId } = input;

      return await ctx.releaseSelectionService.getNodeConsent(
        user,
        releaseKey,
        nodeId
      );
    }),
});
