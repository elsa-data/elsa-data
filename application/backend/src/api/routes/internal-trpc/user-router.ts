import { router, internalProcedure } from "../trpc-bootstrap";
import { z } from "zod";

/**
 * RPC for user permission
 */
export const inputChangeUserPermission = z.object({
  userEmail: z.string(),
  isAllowedRefreshDatasetIndex: z.boolean(),
  isAllowedCreateRelease: z.boolean(),
  isAllowedElsaAdminView: z.boolean(),
});

export const userRouter = router({
  changeUserPermission: internalProcedure
    .input(inputChangeUserPermission)
    .mutation(async ({ input, ctx }) => {
      await ctx.userService.changePermission(ctx.user, input.userEmail, {
        ...input,
      });
    }),
});
