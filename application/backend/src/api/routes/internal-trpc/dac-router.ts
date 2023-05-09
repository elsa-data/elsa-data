import { z } from "zod";
import { internalProcedure, router } from "../trpc-bootstrap";

/**
 * RPC for DAC UI and submissions (some to be migrated over from REST)
 */
export const dacRouter = router({
  // return all the instances of upstream DACS that we want to display in the UI
  getDacInstances: internalProcedure.query(async ({ input, ctx }) => {
    const { user } = ctx;

    return ctx.dacService.getInstances(user);
  }),
});
