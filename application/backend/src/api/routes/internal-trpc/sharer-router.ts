import { internalProcedure, router } from "../trpc-bootstrap";

/**
 * RPC for sharer configuration
 */
export const sharerRouter = router({
  // return all the instances of sharers that we want to conceivably allow to be enabled
  // AND a status flag on each one indicating whether sharing with them would currently work
  // (i.e. object signing might be specified in the config but the corresponding object signing
  // service is not yet notWorking)
  getConfiguredSharers: internalProcedure.query(async ({ input, ctx }) => {
    return ctx.sharerService.getSharersConfiguration();
  }),
});
