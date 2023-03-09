import { router } from "./api/routes/trpc-bootstrap";
import { releaseActivationRouter } from "./api/routes/internal-trpc/release-activation-router";

export const appRouter = router({
  releaseActivation: releaseActivationRouter,
});

export type AppRouter = typeof appRouter;
