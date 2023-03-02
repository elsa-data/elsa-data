import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { Box } from "../../../components/boxes";
import { LayoutBase } from "../../../layouts/layout-base";
import { CasesBox } from "./cases-box/cases-box";
import { VerticalTabs } from "../../../components/vertical-tabs";
import { PresignedUrlForm } from "./presigned-url-form";
import { InformationBox } from "./information-box";
import {
  axiosPostNullMutationFn,
  REACT_QUERY_RELEASE_KEYS,
  specificReleaseQuery,
} from "./queries";
import { BulkBox } from "./bulk-box/bulk-box";
import { isUndefined } from "lodash";
import { FurtherRestrictionsBox } from "./further-restrictions-box";
import { usePageSizer } from "../../../hooks/page-sizer";
import { MasterAccessControlBox } from "./master-access-control-box";
import { LogsBox } from "./logs-box/logs-box";
import { AwsS3VpcShareForm } from "./aws-s3-vpc-share-form";
import { GcpStorageIamShareForm } from "./gcp-storage-iam-share-form";
import { HtsgetForm } from "./htsget-form";
import DataAccessSummaryBox from "./logs-box/data-access-summary";
import { ReleaseTypeLocal } from "./shared-types";
import { EagerErrorBoundary, ErrorState } from "../../../components/errors";
import { ReleasesBreadcrumbsDiv } from "../releases-breadcrumbs-div";

/**
 * The master page layout performing actions/viewing data for a single
 * specific release.
 *
 * This is main page where functionality of Elsa lives and is exposed
 * to users.
 */
export const ReleasesDetailPage: React.FC = () => {
  const { releaseId } = useParams<{ releaseId: string }>();

  if (!releaseId)
    throw new Error(
      `The component ReleasesDetailPage cannot be rendered outside a route with a releaseId param`
    );

  const [error, setError] = useState<ErrorState>({
    error: null,
    isSuccess: true,
  });

  const pageSize = usePageSizer();

  const queryClient = useQueryClient();

  const releaseQuery = useQuery<ReleaseTypeLocal>({
    queryKey: REACT_QUERY_RELEASE_KEYS.detail(releaseId),
    queryFn: specificReleaseQuery,
    onError: (error: any) => setError({ error, isSuccess: false }),
    onSuccess: (_: any) => setError({ error: null, isSuccess: true }),
  });

  const afterMutateUpdateQueryData = (result: ReleaseTypeLocal) => {
    queryClient.setQueryData(
      REACT_QUERY_RELEASE_KEYS.detail(releaseId),
      result
    );
    setError({ error: null, isSuccess: true });
  };

  const cancelMutate = useMutation(
    axiosPostNullMutationFn(`/api/releases/${releaseId}/jobs/cancel`)
  );
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
    }, 5000);
    return () => {
      clearInterval(interval);
    };
  }, [releaseQuery?.data?.runningJob]);

  return (
    <div className="mt-2 flex flex-grow flex-row flex-wrap">
      <>
        <ReleasesBreadcrumbsDiv releaseId={releaseId} />

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
              onClick={async () => {
                cancelMutate.mutate(null, {
                  onSuccess: afterMutateUpdateQueryData,
                  onError: (error: any) =>
                    setError({ error, isSuccess: false }),
                });
              }}
              disabled={releaseQuery.data.runningJob.requestedCancellation}
            >
              Cancel
              {releaseQuery.data.runningJob?.requestedCancellation && (
                <span> (in progress)</span>
              )}
            </button>
          </Box>
        )}

        {releaseQuery.isSuccess && !releaseQuery.data.runningJob && (
          <>
            <InformationBox
              releaseId={releaseId}
              releaseData={releaseQuery.data}
            />

            {releaseQuery.data.permissionEditApplicationCoded && (
              <BulkBox releaseId={releaseId} releaseData={releaseQuery.data} />
            )}

            <CasesBox
              releaseId={releaseId}
              datasetMap={releaseQuery.data.datasetMap}
              isEditable={releaseQuery.data.permissionEditSelections || false}
              pageSize={pageSize}
              isInBulkProcessing={isJobRunning}
            />

            {releaseQuery.data.permissionEditSelections && (
              <FurtherRestrictionsBox
                releaseId={releaseId}
                releaseData={releaseQuery.data}
              />
            )}

            {/*
            {releaseQuery.data.permissionEditSelections && (
              <MasterAccessControlBox
                releaseId={releaseId}
                releaseData={releaseQuery.data}
              />
            )}*/}

            <Box heading="Access Data">
              <VerticalTabs
                tabHeadings={[
                  "Manifest",
                  "Presigned URL",
                  "AWS S3 VPC Share",
                  "GCP Storage IAM Share",
                  "htsget",
                ]}
              >
                <div className="prose">
                  <p>Not implemented</p>
                  <p>
                    Will enable a downloading of a simple manifest with the
                    current release entities (with no access to actual
                    underlying data though)
                  </p>
                  <p>
                    This functionality will always be enabled - as it reveals no
                    more information than the Cases grid i.e. it is a TSV of the
                    cases grid
                  </p>
                </div>
                <PresignedUrlForm
                  releaseId={releaseId}
                  releaseData={releaseQuery.data}
                />
                <AwsS3VpcShareForm releaseId={releaseId} />
                <GcpStorageIamShareForm releaseId={releaseId} />
                <HtsgetForm
                  releaseId={releaseId}
                  releaseData={releaseQuery.data}
                />
                {/*<div className="prose">
                  <p>Not implemented</p>
                  <p>Will enable a GCP sharing as per AWS S3</p>
                </div>*/}
              </VerticalTabs>
            </Box>

            <a href="https://products.aspose.app/cells/viewer" target="_blank">
              TSV Viewer (useful link for demo purposes)
            </a>

            <LogsBox releaseId={releaseId} pageSize={pageSize} />
            <DataAccessSummaryBox releaseId={releaseId} />
          </>
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
