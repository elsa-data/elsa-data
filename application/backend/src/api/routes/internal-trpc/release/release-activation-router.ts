import { SESSION_GLOBUS_TOKEN_KEY_NAME } from "../../../auth/session-cookie-constants";
import { internalProcedure, router } from "../../trpc-bootstrap";
import { inputReleaseKeySingle } from "../input-schemas-common";

/**
 * RPC for release activation
 */
export const releaseActivationRouter = router({
  activate: internalProcedure
    .input(inputReleaseKeySingle)
    .mutation(async ({ input, ctx }) => {
      const globusToken = ctx.req?.session?.get(
        SESSION_GLOBUS_TOKEN_KEY_NAME,
      ) as string | undefined;
      await ctx.releaseActivationService.activateRelease(
        ctx.user,
        input.releaseKey,
        { globusToken },
      );
    }),
  deactivate: internalProcedure
    .input(inputReleaseKeySingle)
    .mutation(async ({ input, ctx }) => {
      const globusToken = ctx.req?.session?.get(
        SESSION_GLOBUS_TOKEN_KEY_NAME,
      ) as string | undefined;
      await ctx.releaseActivationService.deactivateRelease(
        ctx.user,
        input.releaseKey,
        { globusToken },
      );
    }),
});
