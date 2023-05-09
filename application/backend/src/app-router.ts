import { router } from "./api/routes/trpc-bootstrap";
import { releaseActivationRouter } from "./api/routes/internal-trpc/release-activation-router";
import { releaseJobRouter } from "./api/routes/internal-trpc/release-job-router";
import { userRouter } from "./api/routes/internal-trpc/user-router";
import { releaseDataEgressRouter } from "./api/routes/internal-trpc/release-data-egress-router";
import { testRouter } from "./api/routes/internal-trpc/test-router";
import { datasetRouter } from "./api/routes/internal-trpc/dataset-router";
import { releaseRouter } from "./api/routes/internal-trpc/release-router";
import { dacRouter } from "./api/routes/internal-trpc/dac-router";

export const appRouter = router({
  dac: dacRouter,
  datasetRouter: datasetRouter,
  releaseActivation: releaseActivationRouter,
  releaseJob: releaseJobRouter,
  releaseRouter: releaseRouter,
  releaseDataEgress: releaseDataEgressRouter,
  test: testRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
