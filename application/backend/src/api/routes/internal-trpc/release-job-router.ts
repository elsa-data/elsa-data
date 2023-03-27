import { router, internalProcedure } from "../trpc-bootstrap";
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
      if (!ctx.awsAccessPointService.isEnabled)
        throw new Error(
          "The AWS service was not started so AWS Access Point sharing will not work"
        );

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
      if (!ctx.awsAccessPointService.isEnabled)
        throw new Error(
          "The AWS service was not started so AWS Access Point sharing will not work"
        );

      await ctx.jobCloudFormationDeleteService.startCloudFormationDeleteJob(
        ctx.user,
        input.releaseKey
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
