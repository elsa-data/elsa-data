import { router } from "./api/routes/trpc-bootstrap";
import { releaseActivationRouter } from "./api/routes/internal-trpc/release-activation-router";
import { releaseJobRouter } from "./api/routes/internal-trpc/release-job-router";
import { userRouter } from "./api/routes/internal-trpc/user-router";
import { testRouter } from "./api/routes/internal-trpc/test-router";
import { releaseDataEgressRouter } from "./api/routes/internal-trpc/release-data-egress-router";
import { testRouter } from "./api/routes/internal-trpc/test-router";

export const appRouter = router({
  releaseActivation: releaseActivationRouter,
  releaseJob: releaseJobRouter,
  releaseDataEgress: releaseDataEgressRouter,
  user: userRouter,
  test: testRouter,
});

export type AppRouter = typeof appRouter;
