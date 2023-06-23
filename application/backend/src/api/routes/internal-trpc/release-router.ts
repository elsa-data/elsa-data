import { z } from "zod";
import { calculateOffset, internalProcedure, router } from "../trpc-bootstrap";

const inputSingleReleaseKey = z.object({
  releaseKey: z.string(),
});

const htsgetRestriction = z.object({
  restriction: z.union([
    z.literal("CongenitalHeartDefect"),
    z.literal("Autism"),
    z.literal("Achromatopsia"),
  ]),
});

/**
 * RPC for release
 */
export const releaseRouter = router({
  getReleaseConsent: internalProcedure
    .input(inputSingleReleaseKey.merge(z.object({ nodeId: z.string() })))
    .query(async ({ input, ctx }) => {
      const { user } = ctx;
      const { releaseKey, nodeId } = input;

      return await ctx.releaseSelectionService.getNodeConsent(
        user,
        releaseKey,
        nodeId
      );
    }),
  applyHtsgetRestriction: internalProcedure
    .input(inputSingleReleaseKey.merge(htsgetRestriction))
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const { releaseKey, restriction } = input;

      return await ctx.releaseService.applyHtsgetRestriction(
        user,
        releaseKey,
        restriction
      );
    }),
  removeHtsgetRestriction: internalProcedure
    .input(inputSingleReleaseKey.merge(htsgetRestriction))
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const { releaseKey, restriction } = input;

      return await ctx.releaseService.removeHtsgetRestriction(
        user,
        releaseKey,
        restriction
      );
    }),
});
