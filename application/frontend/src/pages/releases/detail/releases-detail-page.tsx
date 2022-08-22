import React from "react";
import { useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { Box, BoxNoPad } from "../../../components/boxes";
import { LayoutBase } from "../../../layouts/layout-base";
import { CasesBox } from "./cases-box/cases-box";
import { VerticalTabs } from "../../../components/vertical-tabs";
import { AwsS3PresignedForm } from "./aws-s3-presigned-form";
import { InformationBox } from "./information-box";
import { REACT_QUERY_RELEASE_KEYS, specificReleaseQuery } from "./queries";
import { BulkBox } from "./bulk-box/bulk-box";
import { isUndefined } from "lodash";
import { FutherRestrictionsBox } from "./further-restrictions-box";
import { usePageSizer } from "../../../hooks/page-sizer";
import { MasterAccessControlBox } from "./master-access-control-box";
import { LogsBox } from "./logs-box/logs-box";
import { AwsS3VpcShareForm } from "./aws-s3-vpc-share-form";
import { HtsgetForm } from "./htsget-form";

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
      "This component should not be rendered outside a route with a releaseId param"
    );

  const pageSize = usePageSizer();

  const queryClient = useQueryClient();

  const releaseQuery = useQuery({
    queryKey: REACT_QUERY_RELEASE_KEYS.detail(releaseId),
    queryFn: specificReleaseQuery,
  });

  const isJobRunning: boolean = !isUndefined(releaseQuery?.data?.runningJob);

  return (
    <LayoutBase>
      <div className="flex flex-row flex-wrap flex-grow mt-2">
        {releaseQuery.isSuccess && (
          <>
            <InformationBox
              releaseId={releaseId}
              releaseData={releaseQuery.data}
            />

            {releaseQuery.data.permissionEditApplicationCoded && (
              <BulkBox releaseId={releaseId} releaseData={releaseQuery.data} />
            )}

            {!isJobRunning && (
              <CasesBox
                releaseId={releaseId}
                datasetMap={releaseQuery.data.datasetMap}
                isEditable={releaseQuery.data.permissionEditSelections || false}
                casesCount={releaseQuery.data.visibleCasesCount}
                pageSize={pageSize}
              />
            )}
            {isJobRunning && (
              <BoxNoPad heading="Cases">
                <>
                  <p>
                    Case processing is happening in the background -
                    cases/patients/specimens will be displayed once this
                    processing is finished.
                  </p>
                  <ul className="h-12">
                    {releaseQuery.data.runningJob!.messages.map((m) => (
                      <li>{m}</li>
                    ))}
                  </ul>
                </>
              </BoxNoPad>
            )}

            {releaseQuery.data.permissionEditSelections && (
              <FutherRestrictionsBox
                releaseId={releaseId}
                releaseData={releaseQuery.data}
              />
            )}

            {releaseQuery.data.permissionEditSelections && (
              <MasterAccessControlBox
                releaseId={releaseId}
                releaseData={releaseQuery.data}
              />
            )}

            <Box heading="Access Data">
              <VerticalTabs
                tabHeadings={[
                  "Manifest",
                  "AWS S3 Presigned URL",
                  "AWS S3 VPC Share",
                  "GCP Cloud Storage Signed URL",
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
                <AwsS3PresignedForm
                  releaseId={releaseId}
                  releaseData={releaseQuery.data}
                />
                <AwsS3VpcShareForm releaseId={releaseId} />
                <div className="prose">
                  <p>Not implemented</p>
                  <p>Will enable a GCP sharing as per AWS S3</p>
                </div>
                <HtsgetForm
                  releaseId={releaseId}
                  releaseData={releaseQuery.data}
                />
              </VerticalTabs>
            </Box>

            <LogsBox releaseId={releaseId} pageSize={pageSize} />
          </>
        )}
      </div>
    </LayoutBase>
  );
};
