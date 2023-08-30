import { router, internalProcedure, calculateOffset } from "../trpc-bootstrap";
import { z } from "zod";
import { inputPaginationParameter } from "./input-schemas-common";

/**
 * RPC for user permission
 */

export const inputUserPermission = z.object({
  isAllowedRefreshDatasetIndex: z.boolean(),
  isAllowedCreateRelease: z.boolean(),
  isAllowedOverallAdministratorView: z.boolean(),
});

export const userRouter = router({
  getOwnUser: internalProcedure.query(async ({ ctx }) => {
    const { user } = ctx;
    return await ctx.userService.getOwnUser(user);
  }),
  getUsers: internalProcedure
    .input(inputPaginationParameter)
    .query(async ({ input, ctx }) => {
      const { user, pageSize } = ctx;
      const { page = 1 } = input;

      return await ctx.userService.getUsers(
        user,
        pageSize,
        calculateOffset(page, pageSize)
      );
    }),
  changeUserPermission: internalProcedure
    .input(inputUserPermission.merge(z.object({ userSubjectId: z.string() })))
    .mutation(async ({ input, ctx }) => {
      await ctx.userService.changePermission(ctx.user, input.userSubjectId, {
        isAllowedCreateRelease: input.isAllowedCreateRelease,
        isAllowedOverallAdministratorView:
          input.isAllowedOverallAdministratorView,
        isAllowedRefreshDatasetIndex: input.isAllowedRefreshDatasetIndex,
      });
    }),

  addPotentialUser: internalProcedure
    .input(
      inputUserPermission.merge(z.object({ newPotentialUserEmail: z.string() }))
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.userService.addPotentialUser(
        ctx.user,
        input.newPotentialUserEmail,
        {
          isAllowedCreateRelease: input.isAllowedCreateRelease,
          isAllowedOverallAdministratorView:
            input.isAllowedOverallAdministratorView,
          isAllowedRefreshDatasetIndex: input.isAllowedRefreshDatasetIndex,
        }
      );
    }),
});
