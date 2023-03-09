import { router, publicProcedure, internalProcedure } from "../trpc-bootstrap";
import { z } from "zod";
export const releaseActivationRouter = router({
  activate: internalProcedure
    .input(
      z.object({
        releaseIdentifier: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.releaseService.activateRelease(
        ctx.user,
        input.releaseIdentifier
      );
    }),
  deactivate: internalProcedure
    .input(
      z.object({
        releaseIdentifier: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.releaseService.deactivateRelease(
        ctx.user,
        input.releaseIdentifier
      );
    }),
});
