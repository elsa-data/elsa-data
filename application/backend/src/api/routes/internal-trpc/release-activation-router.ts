import { internalProcedure, router } from "../trpc-bootstrap";
import { inputReleaseKeySingle } from "./input-schemas-common";

/**
 * RPC for release activation
 */
export const releaseActivationRouter = router({
  activate: internalProcedure
    .input(inputReleaseKeySingle)
    .mutation(async ({ input, ctx }) => {
      await ctx.releaseActivationService.activateRelease(
        ctx.user,
        input.releaseKey
      );
    }),
  deactivate: internalProcedure
    .input(inputReleaseKeySingle)
    .mutation(async ({ input, ctx }) => {
      await ctx.releaseActivationService.deactivateRelease(
        ctx.user,
        input.releaseKey
      );
    }),
});
