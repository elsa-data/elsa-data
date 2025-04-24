import { internalProcedure, router } from "../trpc-bootstrap";
import { z } from "zod";

/**
 * RPC for functionality exposed by the copy service
 */
export const copyServiceRouter = router({
  getCopied: internalProcedure.query(async ({ input, ctx }) => {
    return ctx.copyService.getCopied();
  }),
  getCopiedReport: internalProcedure
    .input(
      z.object({
        executionArn: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return ctx.copyService.getCopiedReport(input.executionArn);
    }),
});
