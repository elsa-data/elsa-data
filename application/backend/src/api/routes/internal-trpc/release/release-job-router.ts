import { z } from "zod";
import { internalProcedure, router } from "../../trpc-bootstrap";
import {
  inputReleaseKey,
  inputReleaseKeySingle,
  unorderedInputPaginationParameter,
} from "../input-schemas-common";

/**
 * The TRPC mutation procedure that triggers install of an AWS Access Point
 */
const startAwsAccessPointInstallProcedure = internalProcedure
  .input(
    z.object({
      awsAccessPointName: z.string(),
      releaseKey: inputReleaseKey,
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // create the cloud formation template and save it to temp S3 bucket
    const s3HttpsUrl =
      await ctx.awsAccessPointService.createAccessPointCloudFormationTemplate(
        ctx.user,
        input.releaseKey,
        input.awsAccessPointName,
      );

    // start the job that actually installs the cloud formation
    await ctx.jobCloudFormationCreateService.startCloudFormationInstallJob(
      ctx.user,
      input.releaseKey,
      s3HttpsUrl,
    );
  });

/**
 * The TRPC mutation procedure that triggers install of an htsget AWS VPC Lattice Access Point
 */
const startHtsgetAwsVpcLatticeAccessPointInstallProcedure = internalProcedure
  .input(
    z.object({
      releaseKey: inputReleaseKey,
      destinationName: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // create the cloud formation template and save it to temp S3 bucket
    const s3HttpsUrl =
      await ctx.htsgetAwsVpcLatticeAccessPointService.createHtsgetVpcLatticeAccessPointCloudFormationTemplate(
        ctx.user,
        input.releaseKey,
        input.destinationName,
      );

    // start the job that actually installs the cloud formation
    await ctx.jobCloudFormationCreateService.startCloudFormationInstallJob(
      ctx.user,
      input.releaseKey,
      s3HttpsUrl,
    );
  });

/**
 * RPC for release jobs
 */
export const releaseJobRouter = router({
  startCohortConstruction: internalProcedure
    .input(inputReleaseKeySingle)
    .mutation(async ({ input, ctx }) => {
      await ctx.jobService.startSelectJob(ctx.user, input.releaseKey);
    }),
  startAwsAccessPointInstall: startAwsAccessPointInstallProcedure,
  startAwsAccessPointUninstall: internalProcedure
    .input(inputReleaseKeySingle)
    .mutation(async ({ input, ctx }) => {
      await ctx.jobCloudFormationDeleteService.startCloudFormationDeleteJob(
        ctx.user,
        input.releaseKey,
      );
    }),
  startHtsgetAwsVpcLatticeAccessPointInstall:
    startHtsgetAwsVpcLatticeAccessPointInstallProcedure,
  startHtsgetAwsVpcLatticeAccessPointUninstall: internalProcedure
    .input(inputReleaseKeySingle)
    .mutation(async ({ input, ctx }) => {
      await ctx.jobCloudFormationDeleteService.startCloudFormationDeleteJob(
        ctx.user,
        input.releaseKey,
      );
    }),
  startCopyOut: internalProcedure
    .input(
      z.object({
        releaseKey: inputReleaseKey,
        destinationBucket: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.jobCopyOutService.startCopyOutJob(
        ctx.user,
        input.releaseKey,
        input.destinationBucket,
      );
    }),
  cancel: internalProcedure
    .input(inputReleaseKeySingle)
    .mutation(async ({ input, ctx }) => {
      await ctx.jobService.cancelInProgressSelectJob(
        ctx.user,
        input.releaseKey,
      );
    }),
  previousJobs: internalProcedure
    .input(inputReleaseKeySingle.merge(unorderedInputPaginationParameter))
    .query(async ({ input, ctx }) => {
      const { user, pageSize } = ctx;

      return (
        (await ctx.jobService.getPreviousJobs(
          user,
          input.releaseKey,
          pageSize,
          (input.page - 1) * pageSize,
        )) ?? { data: [], total: 0 }
      );
    }),
  verifyGlobusUsername: internalProcedure
    .input(
      z.object({
        username: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.globusService.verifyUsername(input.username);
    }),
});
