import { router, publicProcedure, internalProcedure } from "../trpc-bootstrap";
import { z } from "zod";
export const releaseActivationRouter = router({
  activate: internalProcedure
    .input(
      z.object({
        releaseKey: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.releaseService.activateRelease(ctx.user, input.releaseKey);
    }),
  deactivate: internalProcedure
    .input(
      z.object({
        releaseKey: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.releaseService.deactivateRelease(ctx.user, input.releaseKey);
    }),
});
