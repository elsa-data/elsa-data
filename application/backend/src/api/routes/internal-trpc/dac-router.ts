import { z } from "zod";
import { internalProcedure, router } from "../trpc-bootstrap";

/**
 * RPC for DAC UI and submissions
 */
export const dacRouter = router({
  // return all the instances of upstream DACS that we want to display in the UI
  getConfiguredDacs: internalProcedure.query(async ({ input, ctx }) => {
    const { user } = ctx;

    return ctx.dacService.getConfigured(user);
  }),
  detectNew: internalProcedure
    .input(
      z.object({
        dacId: z.string(),
        dacData: z.any(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;

      // the DAC service will map the operation onto the correct actual specific DAC service (via dacId and the config)
      return ctx.dacService.detectNew(user, input.dacId, input.dacData);
    }),
  createNew: internalProcedure
    .input(
      z.object({
        dacId: z.string(),
        dacData: z.any(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;

      // the DAC service will map the operation onto the correct actual specific DAC service (via dacId and the config)
      return ctx.dacService.createNew(user, input.dacId, input.dacData);
    }),
});
