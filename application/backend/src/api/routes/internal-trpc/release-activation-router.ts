import { router, internalProcedure } from "../trpc-bootstrap";
import { z } from "zod";

/**
 * RPC for release activation
 */
export const releaseActivationRouter = router({
  activate: internalProcedure
    .input(
      z.object({
        releaseKey: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.releaseActivationService.activateRelease(
        ctx.user,
        input.releaseKey
      );
    }),
  deactivate: internalProcedure
    .input(
      z.object({
        releaseKey: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.releaseActivationService.deactivateRelease(
        ctx.user,
        input.releaseKey
      );
    }),
});
