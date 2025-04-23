import { internalProcedure, router } from "../trpc-bootstrap";

/**
 * RPC for functionality exposed by the copy service
 */
export const copyServiceRouter = router({
  getCopied: internalProcedure.query(async ({ input, ctx }) => {
    return ctx.copyService.getCopied();
  }),
});
