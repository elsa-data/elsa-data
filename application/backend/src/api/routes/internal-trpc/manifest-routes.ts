import { internalProcedure, router } from "../trpc-bootstrap";
import { inputReleaseKeySingle } from "./input-schemas-common";

/**
 * RPC for manifest
 */
export const manifestRouter = router({
  getReleaseSize: internalProcedure
    .input(inputReleaseKeySingle)
    .query(async ({ input, ctx }) => {
      const { user } = ctx;
      const { releaseKey } = input;

      return await ctx.manifestService.computeReleaseSize(user, releaseKey);
    }),
});
