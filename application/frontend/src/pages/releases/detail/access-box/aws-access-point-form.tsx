import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ReleaseTypeLocal } from "../../shared-types";
import { TsvDownloadDiv } from "./tsv-download-div";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

/**
 * A form that displays AWS access point info from the
 * perspective of the researcher.
 *
 * @param releaseKey
 * @param releaseData
 * @constructor
 */
export const AwsAccessPointForm: React.FC<Props> = ({
  releaseKey,
  releaseData,
}) => {
  return (
    <>
      <div className="prose-sm">
        <p>
          AWS access points allow the direct native sharing of S3 objects to
          another AWS account/network.
        </p>
        {releaseData?.dataSharingAwsAccessPoint?.installed && (
          <p>
            This access point is shared to VPC{" "}
            <span className="font-mono">
              {releaseData?.dataSharingAwsAccessPoint?.vpcId}
            </span>
            . The VPC lives in AWS account{" "}
            <span className="font-mono">
              {releaseData?.dataSharingAwsAccessPoint?.accountId}
            </span>
            .
          </p>
        )}
        {/*{releaseData?.dataSharingAwsAccessPoint?.name}
        {releaseData?.dataSharingAwsAccessPoint?.installed}
        {releaseData?.dataSharingAwsAccessPoint?.installedStackArn} */}
      </div>

      <div className="divider"></div>

      <TsvDownloadDiv
        actionUrl={`/api/releases/${releaseKey}/tsv-manifest-aws-access-point`}
        releaseActivated={!!releaseData.activation}
        fieldsToExclude={[]}
      />
    </>
  );
};
