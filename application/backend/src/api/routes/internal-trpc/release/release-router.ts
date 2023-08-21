import { z } from "zod";
import { ReleaseActivationPermissionError } from "../../../../business/exceptions/release-activation";
import {
  calculateOffset,
  internalProcedure,
  router,
} from "../../trpc-bootstrap";
import {
  inputPaginationParameter,
  inputReleaseKeySingle,
  unorderedInputPaginationParameter,
} from "../input-schemas-common";
import { PagedResult } from "../../../helpers/pagination-helpers";
import { ReleaseCaseType } from "@umccr/elsa-types";

const htsgetRestriction = z.object({
  restriction: z.union([
    z.literal("CongenitalHeartDefect"),
    z.literal("Autism"),
    z.literal("Achromatopsia"),
  ]),
});

const casesQuerySchema = inputReleaseKeySingle
  .merge(unorderedInputPaginationParameter)
  .merge(
    z.object({
      q: z.optional(z.string().trim()),
    })
  );

const specimensMutateSchema = inputReleaseKeySingle.merge(
  z.object({
    op: z.literal("remove").or(z.literal("add")),
    dbIds: z.array(z.string()),
    externalIdentifierValues: z.array(z.string()),
    selectAll: z.boolean(),
  })
);

/**
 * RPC for release
 */
export const releaseRouter = router({
  getAllRelease: internalProcedure
    .input(inputPaginationParameter)
    .query(async ({ input, ctx }) => {
      const { user, pageSize } = ctx;
      const { page = 1 } = input;

      return await ctx.releaseService.getAll(
        user,
        pageSize,
        calculateOffset(page, pageSize)
      );
    }),
  getSpecificRelease: internalProcedure
    .input(inputReleaseKeySingle)
    .query(async ({ input, ctx }) => {
      const { user } = ctx;
      const { releaseKey } = input;

      return await ctx.releaseService.get(user, releaseKey);
    }),
  getReleaseCases: internalProcedure
    .input(casesQuerySchema)
    .query(async ({ input, ctx }) => {
      const { user, pageSize } = ctx;
      const { releaseKey, page, q } = input;

      return await ctx.releaseSelectionService.getCases(
        user,
        releaseKey,
        pageSize,
        calculateOffset(page, pageSize),
        q
      );
    }),
  updateReleaseSpecimens: internalProcedure
    .input(specimensMutateSchema)
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const { releaseKey, op, dbIds, externalIdentifierValues, selectAll } =
        input;

      if (op === "add")
        await ctx.releaseSelectionService.setSelected(
          user,
          releaseKey,
          dbIds,
          externalIdentifierValues,
          selectAll
        );

      if (op === "remove")
        await ctx.releaseSelectionService.setUnselected(
          user,
          releaseKey,
          dbIds,
          externalIdentifierValues,
          selectAll
        );
    }),
  getReleasePassword: internalProcedure
    .input(inputReleaseKeySingle)
    .query(async ({ input, ctx }) => {
      const { user } = ctx;
      const { releaseKey } = input;

      return await ctx.releaseService.getPassword(user, releaseKey);
    }),
  getReleaseConsent: internalProcedure
    .input(inputReleaseKeySingle.merge(z.object({ nodeId: z.string() })))
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
    .input(inputReleaseKeySingle.merge(htsgetRestriction))
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
    .input(inputReleaseKeySingle.merge(htsgetRestriction))
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
