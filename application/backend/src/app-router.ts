import { auditEventRouter } from "./api/routes/internal-trpc/audit-event-router";
import { copyServiceRouter } from "./api/routes/internal-trpc/copy-service-router";
import { dacRouter } from "./api/routes/internal-trpc/dac-router";
import { datasetRouter } from "./api/routes/internal-trpc/dataset-router";
import { manifestRouter } from "./api/routes/internal-trpc/manifest-routes";
import { releaseActivationRouter } from "./api/routes/internal-trpc/release/release-activation-router";
import { releaseDataEgressRouter } from "./api/routes/internal-trpc/release/release-data-egress-router";
import { releaseJobRouter } from "./api/routes/internal-trpc/release/release-job-router";
import { releaseParticipantRouter } from "./api/routes/internal-trpc/release/release-participant-router";
import { releaseRouter } from "./api/routes/internal-trpc/release/release-router";
import { sharerRouter } from "./api/routes/internal-trpc/sharer-router";
import { testRouter } from "./api/routes/internal-trpc/test-router";
import { userRouter } from "./api/routes/internal-trpc/user-router";
import { router } from "./api/routes/trpc-bootstrap";

export const appRouter = router({
  auditEvent: auditEventRouter,
  copyService: copyServiceRouter,
  dac: dacRouter,
  dataset: datasetRouter,
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
