import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ReleaseTypeLocal } from "../../shared-types";

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
  const queryClient = useQueryClient();

  return (
    <div>
      <p>
        Add button to download manifest.
        <br />
        {releaseData?.dataSharingAwsAccessPoint?.name}
        <br />
        {releaseData?.dataSharingAwsAccessPoint?.vpcId}
        <br />
        {releaseData?.dataSharingAwsAccessPoint?.accountId}
        <br />
        {releaseData?.dataSharingAwsAccessPoint?.installed}
        <br />
        {releaseData?.dataSharingAwsAccessPoint?.installedStackArn}
        <br />
      </p>
    </div>
  );
};
