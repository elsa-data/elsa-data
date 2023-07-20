import { router } from "./api/routes/trpc-bootstrap";
import { releaseActivationRouter } from "./api/routes/internal-trpc/release/release-activation-router";
import { releaseJobRouter } from "./api/routes/internal-trpc/release/release-job-router";
import { userRouter } from "./api/routes/internal-trpc/user-router";
import { releaseDataEgressRouter } from "./api/routes/internal-trpc/release/release-data-egress-router";
import { releaseParticipantRouter } from "./api/routes/internal-trpc/release/release-participant-router";
import { testRouter } from "./api/routes/internal-trpc/test-router";
import { datasetRouter } from "./api/routes/internal-trpc/dataset-router";
import { manifestRouter } from "./api/routes/internal-trpc/manifest-routes";
import { releaseRouter } from "./api/routes/internal-trpc/release/release-router";
import { dacRouter } from "./api/routes/internal-trpc/dac-router";
import { auditEventRouter } from "./api/routes/internal-trpc/audit-event-router";
import { sharerRouter } from "./api/routes/internal-trpc/sharer-router";

export const appRouter = router({
  dac: dacRouter,
  auditEventRouter: auditEventRouter,
  datasetRouter: datasetRouter,
  manifest: manifestRouter,
  release: releaseRouter,
  releaseActivation: releaseActivationRouter,
  releaseDataEgress: releaseDataEgressRouter,
  releaseJob: releaseJobRouter,
  releaseParticipant: releaseParticipantRouter,
  sharer: sharerRouter,
  test: testRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
