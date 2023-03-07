import React from "react";
import { Box } from "../../../components/boxes";
import { CasesBox } from "./cases-box/cases-box";
import { VerticalTabs } from "../../../components/vertical-tabs";
import { PresignedUrlForm } from "./presigned-url-form";
import { InformationBox } from "./information-box";
import { FurtherRestrictionsBox } from "./further-restrictions-box";
import { usePageSizer } from "../../../hooks/page-sizer";
import { LogsBox } from "./logs-box/logs-box";
import { AwsS3VpcShareForm } from "./aws-s3-vpc-share-form";
import { GcpStorageIamShareForm } from "./gcp-storage-iam-share-form";
import { HtsgetForm } from "./htsget-form";
import { useReleasesMasterData } from "../releases-types";

/**
 * The sub-page display the main details a single
 * specific release.
 */
export const ReleasesDetailSubPage: React.FC = () => {
  const { releaseId, releaseData } = useReleasesMasterData();

  const pageSize = usePageSizer();

  return (
    <>
      <InformationBox releaseId={releaseId} releaseData={releaseData} />

      <CasesBox
        releaseId={releaseId}
        datasetMap={releaseData.datasetMap}
        isEditable={releaseData.permissionEditSelections || false}
        pageSize={pageSize}
        releaseIsActivated={!!releaseData.activation}
      />

      {releaseData.permissionEditSelections && (
        <FurtherRestrictionsBox
          releaseId={releaseId}
          releaseData={releaseData}
        />
      )}

      <Box
        heading="Access Data"
        applyIsDisabledStyle={!!!releaseData.activation}
      >
        <VerticalTabs
          tabHeadings={[
            "Manifest",
            "Presigned URLs",
            "AWS S3 VPC Share",
            "GCP Storage IAM Share",
            "htsget",
          ]}
        >
          <div className="prose">
            <p>Not implemented</p>
            <p>
              Will enable a downloading of a simple manifest with the current
              release entities (with no access to actual underlying data though)
            </p>
            <p>
              This functionality will always be enabled - as it reveals no more
              information than the Cases grid i.e. it is a TSV of the cases grid
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
    </>
  );
};
