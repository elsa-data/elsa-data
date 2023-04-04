import React from "react";
import { Box } from "../../../components/boxes";
import { CasesBox } from "./cases-box/cases-box";
import { VerticalTabs } from "../../../components/vertical-tabs";
import { PresignedUrlForm } from "./presigned-url-form";
import { InformationBox } from "./information-box";
import { FurtherRestrictionsBox } from "./further-restrictions-box";
import { usePageSizer } from "../../../hooks/page-sizer";
import { AwsS3VpcShareForm } from "./aws-s3-vpc-share-form";
import { GcpStorageIamShareForm } from "./gcp-storage-iam-share-form";
import { HtsgetForm } from "./htsget-form";
import { useReleasesMasterData } from "../releases-types";
import { CopyOutForm } from "./copy-out-form";

/**
 * The sub-page display the main details a single
 * specific release.
 */
export const ReleasesDetailSubPage: React.FC = () => {
  const { releaseKey, releaseData } = useReleasesMasterData();

  const pageSize = usePageSizer();

  return (
    <>
      <InformationBox releaseKey={releaseKey} releaseData={releaseData} />

      <CasesBox
        releaseKey={releaseKey}
        datasetMap={releaseData.datasetMap}
        isEditable={releaseData.permissionEditSelections || false}
        pageSize={pageSize}
        releaseIsActivated={!!releaseData.activation}
      />

      {releaseData.permissionEditSelections && (
        <FurtherRestrictionsBox
          releaseKey={releaseKey}
          releaseData={releaseData}
        />
      )}

      <Box heading="Access Data" applyIsDisabledStyle={!releaseData.activation}>
        <VerticalTabs
          tabHeadings={[
            "Manifest",
            "Presigned URLs",
            "Copy Out",
            "AWS S3 VPC Share",
            "GCP Storage IAM Share",
            ...(releaseData.htsgetConfig !== undefined ? ["htsget"] : []),
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
          <PresignedUrlForm releaseKey={releaseKey} releaseData={releaseData} />
          <CopyOutForm releaseKey={releaseKey} />
          <AwsS3VpcShareForm releaseKey={releaseKey} />
          <GcpStorageIamShareForm releaseKey={releaseKey} />
          {releaseData.htsgetConfig && (
            <HtsgetForm
              releaseKey={releaseKey}
              htsgetUrl={releaseData.htsgetConfig.url}
            />
          )}
        </VerticalTabs>
      </Box>
    </>
  );
};
