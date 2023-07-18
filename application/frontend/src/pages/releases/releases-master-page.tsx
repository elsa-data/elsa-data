import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Outlet, useParams } from "react-router-dom";
import { Box } from "../../components/boxes";
import { makeReleaseTypeLocal } from "./queries";
import { isUndefined } from "lodash";
import { EagerErrorBoundary, ErrorState } from "../../components/errors";
import { ReleasesBreadcrumbsDiv } from "./releases-breadcrumbs-div";
import { ReleasesMasterContextType } from "./releases-types";
import { trpc } from "../../helpers/trpc";
import { Alert, TriangleExclamationIcon } from "../../components/alert";
import {
  differenceFromNow,
  formatFromNowTime,
  Millisecond,
} from "../../helpers/datetime-helper";
import { useCookies } from "react-cookie";
import { IsLoadingDiv } from "../../components/is-loading-div";
import { useLoggedInUser } from "../../providers/logged-in-user-provider";

/**
 * The master page layout performing actions/viewing data for a single
 * specific release. The subcomponents of this page (such as
 * the Details Page, the Bulk Page, the Logs Page) are passed in
 * the release data via Outlet context.
 */
export const ReleasesMasterPage: React.FC = () => {
  const REFRESH_JOB_STATUS_MS = 5000;
  const ALERT_RELEASE_EDITED_TIME: Millisecond = 600000;

  const user = useLoggedInUser();

  const { releaseKey } = useParams<{ releaseKey: string }>();

  if (!releaseKey)
    throw new Error(
      `The component ReleasesMasterPage cannot be rendered outside a route with a releaseKey param`
    );

  const [error, setError] = useState<ErrorState>({
    error: null,
    isSuccess: true,
  });

  const queryClient = useQueryClient();

  const releaseQuery = trpc.release.getSpecificRelease.useQuery(
    { releaseKey },
    {
      onError: (error: any) => setError({ error, isSuccess: false }),
      onSuccess: (_: any) => setError({ error: null, isSuccess: true }),
      // whenever we get the data we need to augment it with a little bit of local knowledge
      select: (d: any) => makeReleaseTypeLocal(d),
    }
  );

  const cancelMutate = trpc.releaseJob.cancel.useMutation({
    onSettled: () => queryClient.invalidateQueries(),
    onSuccess: () => setError({ error: null, isSuccess: true }),
    onError: (error: any) => setError({ error, isSuccess: false }),
  });

  // *only* when running a job in the background - we want to set up a polling loop of the backend
  // so we set this effect up with a dependency on the runningJob field - and switch the
  // interval on only when there is background job
  useEffect(() => {
    const interval = setInterval(() => {
      if (releaseQuery?.data?.runningJob) {
        // we are busy waiting on the job to complete - so we can invalidate the whole cache
        // as the jobs may affect the entire UI (audit logs, cases etc)
        queryClient.invalidateQueries().then(() => {});
      }
    }, REFRESH_JOB_STATUS_MS);
    return () => {
      clearInterval(interval);
    };
  }, [releaseQuery?.data?.runningJob]);

  const masterOutletContext: ReleasesMasterContextType = {
    releaseKey: releaseKey,
    // note: that whilst we might construct the outlet context here with data being undefined (hence needing !),
    // it is ok because in that case we never actually use this masterOutletContext..
    releaseData: releaseQuery.data!,
    releaseDataIsFetching: releaseQuery.isFetching,
  };

  const lastUpdated = releaseQuery.data?.lastUpdatedDateTime as
    | string
    | undefined;
  const lastUpdatedSubjectId = releaseQuery.data?.lastUpdatedUserSubjectId;

  return (
    <div className="flex flex-grow flex-row flex-wrap space-y-6">
      <>
        {!error.isSuccess && <EagerErrorBoundary error={error.error} />}

        {releaseQuery.isLoading && <IsLoadingDiv />}

        {releaseQuery.isSuccess && (
          <>
            {differenceFromNow(lastUpdated) <= ALERT_RELEASE_EDITED_TIME &&
              lastUpdatedSubjectId !== user?.subjectIdentifier && (
                <Alert
                  key={`${lastUpdated} ${lastUpdatedSubjectId}`}
                  icon={<TriangleExclamationIcon />}
                  additionalAlertClassName={"alert-warning"}
                  description={`Someone else has recently edited this release (${formatFromNowTime(
                    lastUpdated
                  )}). Consider if what you are intending to do will interfere with their editing.`}
                />
              )}

            <ReleasesBreadcrumbsDiv
              releaseKey={releaseKey}
              releaseData={masterOutletContext.releaseData}
            />

            {/* NOTE job information will only be returned from the backend where the user is a release
                     administrator - so this section will only appear for admins */}
            {releaseQuery.data.runningJob && (
              <Box heading="Background Job">
                <div className="mb-4 flex justify-between">
                  <span className="text-base font-medium text-blue-700">
                    Running
                  </span>
                  <span className="text-sm font-medium text-blue-700">
                    {releaseQuery.data.runningJob.percentDone.toString()}%
                  </span>
                </div>
                <div className="mb-4 h-2.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2.5 rounded-full bg-blue-600"
                    style={{
                      width:
                        releaseQuery.data.runningJob.percentDone.toString() +
                        "%",
                    }}
                  ></div>
                </div>
                <button
                  className="btn-normal"
                  onClick={() =>
                    cancelMutate.mutate({
                      releaseKey: releaseKey,
                    })
                  }
                  disabled={
                    cancelMutate.isLoading ||
                    releaseQuery.data.runningJob.requestedCancellation
                  }
                >
                  Cancel
                  {releaseQuery.data.runningJob?.requestedCancellation && (
                    <span> (in progress)</span>
                  )}
                </button>
              </Box>
            )}

            <Outlet context={masterOutletContext} />
          </>
        )}
      </>
    </div>
  );
};
