import { router } from "./api/routes/trpc-bootstrap";
import { releaseActivationRouter } from "./api/routes/internal-trpc/release-activation-router";
import { releaseJobRouter } from "./api/routes/internal-trpc/release-job-router";
import { userRouter } from "./api/routes/internal-trpc/user-router";
import { releaseDataAccessedRouter } from "./api/routes/internal-trpc/release-data-accessed-router";

export const appRouter = router({
  releaseActivation: releaseActivationRouter,
  releaseJob: releaseJobRouter,
  releaseDataAccessed: releaseDataAccessedRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
