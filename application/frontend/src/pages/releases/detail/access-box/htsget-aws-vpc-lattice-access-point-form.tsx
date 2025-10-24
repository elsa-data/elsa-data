import React from "react";
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
export const HtsgetAwsVpcLatticeAccessPointForm: React.FC<Props> = ({
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
        {releaseData?.dataSharingHtsgetAwsVpcLatticeAccessPoint?.installed && (
          <p>
            This access point is shared to VPC{" "}
            <span className="font-mono">
              {releaseData?.dataSharingHtsgetAwsVpcLatticeAccessPoint?.vpcId}
            </span>
            . The VPC lives in AWS account{" "}
            <span className="font-mono">
              {
                releaseData?.dataSharingHtsgetAwsVpcLatticeAccessPoint
                  ?.accountId
              }
            </span>
            .
          </p>
        )}
      </div>

      <div className="divider"></div>

      <TsvDownloadDiv
        actionUrl={`/api/releases/${releaseKey}/tsv-manifest-htsget-aws-vpc-lattice-access-point`}
        releaseActivated={!!releaseData.activation}
        fieldsToExclude={[]}
      />
    </>
  );
};
