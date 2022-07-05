import React from "react";
import { useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { Box } from "../../../components/boxes";
import { LayoutBase } from "../../../layouts/layout-base";
import { CasesTable } from "./cases-table";
import { VerticalTabs } from "../../../components/vertical-tabs";
import { AwsS3PresignedForm } from "./aws-s3-presigned-form";
import { ApplicationCodedBox } from "./application-coded-box";
import { InformationBox } from "./information-box";
import { REACT_QUERY_RELEASE_KEYS, specificReleaseQuery } from "./queries";
import { BulkBox } from "./bulk-box";
import { isUndefined } from "lodash";

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

            <Box heading="Cases">
              <div className="shadow-md rounded-lg">
                {!isJobRunning && (
                  <CasesTable
                    releaseId={releaseId}
                    datasetMap={releaseQuery.data.datasetMap}
                    isEditable={
                      releaseQuery.data.permissionEditSelections || false
                    }
                  />
                )}
                {isJobRunning && (
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
                )}
              </div>
            </Box>

            <Box heading="Access Data">
              <div className="flex">
                <VerticalTabs tabs={["AWS S3 PreSigned", "htsget"]}>
                  <AwsS3PresignedForm releaseId={releaseId} />
                  <form>
                    <input type="submit" className="btn-blue w-60" />
                  </form>
                </VerticalTabs>
              </div>
            </Box>
          </>
        )}
      </div>
    </LayoutBase>
  );
};
