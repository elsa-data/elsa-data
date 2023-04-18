import { z } from "zod";
import { calculateOffset, internalProcedure, router } from "../trpc-bootstrap";

const inputSingleReleaseKey = z.object({
  releaseKey: z.string(),
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
});
