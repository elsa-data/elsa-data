import { router } from "./api/routes/trpc-bootstrap";
import { releaseActivationRouter } from "./api/routes/internal-trpc/release-activation-router";
import { releaseJobRouter } from "./api/routes/internal-trpc/release-job-router";

export const appRouter = router({
  releaseActivation: releaseActivationRouter,
  releaseJob: releaseJobRouter,
});

export type AppRouter = typeof appRouter;
