import { router, internalProcedure } from "../trpc-bootstrap";
import { z } from "zod";
import { inputReleaseKeySingleParameter } from "./input-schemas-common";

/**
 * RPC for release activation
 */
export const releaseActivationRouter = router({
  activate: internalProcedure
    .input(inputReleaseKeySingleParameter)
    .mutation(async ({ input, ctx }) => {
      await ctx.releaseService.activateRelease(ctx.user, input.releaseKey);
    }),
  deactivate: internalProcedure
    .input(inputReleaseKeySingleParameter)
    .mutation(async ({ input, ctx }) => {
      await ctx.releaseService.deactivateRelease(ctx.user, input.releaseKey);
    }),
});
