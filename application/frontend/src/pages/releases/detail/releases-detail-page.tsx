import React from "react";
import { useParams } from "react-router-dom";
import { Box } from "../../../components/boxes";
import { CasesBox } from "./cases-box/cases-box";
import { VerticalTabs } from "../../../components/vertical-tabs";
import { PresignedUrlForm } from "./presigned-url-form";
import { InformationBox } from "./information-box";
import { BulkBox } from "./bulk-box/bulk-box";
import { FurtherRestrictionsBox } from "./further-restrictions-box";
import { usePageSizer } from "../../../hooks/page-sizer";
import { LogsBox } from "./logs-box/logs-box";
import { AwsS3VpcShareForm } from "./aws-s3-vpc-share-form";
import { GcpStorageIamShareForm } from "./gcp-storage-iam-share-form";
import { HtsgetForm } from "./htsget-form";
import DataAccessSummaryBox from "./logs-box/data-access-summary";
import { useReleasesMasterData } from "./releases-master-page";

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

  const { releaseData } = useReleasesMasterData();

  const pageSize = usePageSizer();

  return (
    <div className="mt-2 flex flex-grow flex-row flex-wrap">
      <>
        <InformationBox releaseId={releaseId} releaseData={releaseData} />

        {releaseData.permissionEditApplicationCoded && (
          <BulkBox releaseId={releaseId} releaseData={releaseData} />
        )}

        <CasesBox
          releaseId={releaseId}
          datasetMap={releaseData.datasetMap}
          isEditable={releaseData.permissionEditSelections || false}
          pageSize={pageSize}
          isInBulkProcessing={false}
        />

        {releaseData.permissionEditSelections && (
          <FurtherRestrictionsBox
            releaseId={releaseId}
            releaseData={releaseData}
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
                Will enable a downloading of a simple manifest with the current
                release entities (with no access to actual underlying data
                though)
              </p>
              <p>
                This functionality will always be enabled - as it reveals no
                more information than the Cases grid i.e. it is a TSV of the
                cases grid
              </p>
            </div>
            <PresignedUrlForm releaseId={releaseId} releaseData={releaseData} />
            <AwsS3VpcShareForm releaseId={releaseId} />
            <GcpStorageIamShareForm releaseId={releaseId} />
            <HtsgetForm releaseId={releaseId} releaseData={releaseData} />
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
    </div>
  );
};
