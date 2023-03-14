import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, useOutletContext, useParams } from "react-router-dom";
import { Box } from "../../components/boxes";
import {
  axiosPostNullMutationFn,
  REACT_QUERY_RELEASE_KEYS,
  specificReleaseQuery,
} from "./queries";
import { isUndefined } from "lodash";
import { ReleaseTypeLocal } from "./shared-types";
import { EagerErrorBoundary, ErrorState } from "../../components/errors";
import { ReleasesBreadcrumbsDiv } from "./releases-breadcrumbs-div";
import { SkeletonOneDiv } from "../../components/skeleton-one";
import { SkeletonTwoDiv } from "../../components/skeleton-two";
import { ReleasesMasterContextType } from "./releases-types";
import { trpc } from "../../helpers/trpc";

/**
 * The master page layout performing actions/viewing data for a single
 * specific release. The subcomponents of this page (such as
 * the Details Page, the Bulk Page, the Logs Page) are passed in
 * the release data via Outlet context.
 */
export const ReleasesMasterPage: React.FC = () => {
  const REFRESH_JOB_STATUS_MS = 5000;

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

  const releaseQuery = useQuery<ReleaseTypeLocal>({
    queryKey: REACT_QUERY_RELEASE_KEYS.detail(releaseKey),
    queryFn: specificReleaseQuery,
    onError: (error: any) => setError({ error, isSuccess: false }),
    onSuccess: (_: any) => setError({ error: null, isSuccess: true }),
  });

  const cancelMutate = trpc.releaseJob.cancel.useMutation({
    onSettled: () => queryClient.invalidateQueries(),
    onSuccess: () => setError({ error: null, isSuccess: true }),
    onError: (error: any) => setError({ error, isSuccess: false }),
  });

  const isJobRunning: boolean = !isUndefined(releaseQuery?.data?.runningJob);

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
    // in that case we never actually use this masterOutletContext..
    releaseData: releaseQuery.data!,
  };

  return (
    <div className="flex flex-grow flex-row flex-wrap space-y-6">
      <>
        <ReleasesBreadcrumbsDiv releaseKey={releaseKey} />

        {releaseQuery.isSuccess && releaseQuery.data.runningJob && (
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
                    releaseQuery.data.runningJob.percentDone.toString() + "%",
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

        {releaseQuery.isSuccess && releaseQuery.data.runningJob && (
          <>
            <SkeletonOneDiv />
            <SkeletonTwoDiv />
          </>
        )}

        {releaseQuery.isSuccess && !releaseQuery.data.runningJob && (
          <Outlet context={masterOutletContext} />
        )}

        {!error.isSuccess && (
          <EagerErrorBoundary
            message={"Something went wrong fetching release data."}
            error={error.error}
            styling={"bg-red-100"}
          />
        )}
      </>
    </div>
  );
};
