import { internalProcedure, router } from "../trpc-bootstrap";
import { z } from "zod";
import {
  inputReleaseKey,
  inputReleaseKeySingleParameter,
} from "./input-schemas-common";

/**
 * RPC for release jobs
 */
export const releaseJobRouter = router({
  startCohortConstruction: internalProcedure
    .input(inputReleaseKeySingleParameter)
    .mutation(async ({ input, ctx }) => {
      await ctx.jobService.startSelectJob(ctx.user, input.releaseKey);
    }),
  startAccessPointInstall: internalProcedure
    .input(
      z.object({
        releaseKey: inputReleaseKey,
        accounts: z.array(z.string()),
        vpcId: z.optional(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const s3HttpsUrl =
        await ctx.awsAccessPointService.createAccessPointCloudFormationTemplate(
          ctx.user,
          input.releaseKey,
          input.accounts,
          input.vpcId
        );

      await ctx.jobCloudFormationCreateService.startCloudFormationInstallJob(
        ctx.user,
        input.releaseKey,
        s3HttpsUrl
      );
    }),
  startAccessPointUninstall: internalProcedure
    .input(inputReleaseKeySingleParameter)
    .mutation(async ({ input, ctx }) => {
      await ctx.jobCloudFormationDeleteService.startCloudFormationDeleteJob(
        ctx.user,
        input.releaseKey
      );
    }),
  startCopyOut: internalProcedure
    .input(
      z.object({
        releaseKey: inputReleaseKey,
        destinationBucket: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.jobCopyOutService.startCopyOutJob(
        ctx.user,
        input.releaseKey,
        input.destinationBucket
      );
    }),
  cancel: internalProcedure
    .input(inputReleaseKeySingleParameter)
    .mutation(async ({ input, ctx }) => {
      await ctx.jobService.cancelInProgressSelectJob(
        ctx.user,
        input.releaseKey
      );
    }),
});
