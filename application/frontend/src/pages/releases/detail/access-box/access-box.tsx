import React from "react";
import { ReleaseTypeLocal } from "../../shared-types";
import { VerticalTabs } from "../../../../components/vertical-tabs";
import { Box } from "../../../../components/boxes";
import { ManifestForm } from "./manifest-form";
import { CopyOutForm } from "./copy-out-form";
import { AwsS3VpcShareForm } from "./aws-s3-vpc-share-form";
import { GcpStorageIamShareForm } from "./gcp-storage-iam-share-form";
import { HtsgetForm } from "./htsget-form";
import { useEnvRelay } from "../../../../providers/env-relay-provider";
import {
  FEATURE_DATA_SHARING_AWS_ACCESS_POINT,
  FEATURE_DATA_SHARING_COPY_OUT,
  FEATURE_DATA_SHARING_GCP_IAM,
  FEATURE_DATA_SHARING_HTSGET,
} from "@umccr/elsa-constants";
import { ObjectSigningForm } from "./object-signing-form";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

/**
 * A box for the researcher/applicant showing only those mechanism that
 * have been enabled for them.
 */
export const AccessBox: React.FC<Props> = ({ releaseKey, releaseData }) => {
  const { features } = useEnvRelay();

  // from the perspective of the researcher/user
  // NOTE if notWorking correctly - the release data should never have config information for a mechanism
  // that is not in the feature set (i.e if COPY_OUT is switched off - then dataSharingCopyOut should be undefined)
  // however, no harm in putting an extra guard here too
  const dataSharingObjectSigning = !!releaseData.dataSharingObjectSigning;
  const dataSharingCopyOut =
    features.has(FEATURE_DATA_SHARING_COPY_OUT) &&
    !!releaseData.dataSharingCopyOut;
  const dataSharingHtsget =
    features.has(FEATURE_DATA_SHARING_HTSGET) &&
    !!releaseData.dataSharingHtsget;
  const dataSharingAwsAccessPoint =
    features.has(FEATURE_DATA_SHARING_AWS_ACCESS_POINT) &&
    !!releaseData.dataSharingAwsAccessPoint;
  const dataSharingGcpStorageIam =
    features.has(FEATURE_DATA_SHARING_GCP_IAM) &&
    !!releaseData.dataSharingGcpStorageIam;

  const tabHeadings: string[] = ["Manifest"];

  if (dataSharingObjectSigning) tabHeadings.push("Object Signing");
  if (dataSharingCopyOut) tabHeadings.push("Copy Out");
  if (dataSharingHtsget) tabHeadings.push("htsget");
  if (dataSharingAwsAccessPoint) tabHeadings.push("AWS Access Point");
  if (dataSharingGcpStorageIam) tabHeadings.push("GCP Storage IAM");

  return (
    <Box heading="Access Data" applyIsDisabledStyle={!releaseData.activation}>
      <VerticalTabs tabHeadings={tabHeadings}>
        <ManifestForm releaseKey={releaseKey} releaseData={releaseData} />
        {dataSharingObjectSigning && (
          <ObjectSigningForm
            releaseKey={releaseKey}
            releaseData={releaseData}
          />
        )}
        {dataSharingCopyOut && (
          <CopyOutForm releaseKey={releaseKey} releaseData={releaseData} />
        )}
        {dataSharingHtsget && (
          <HtsgetForm
            releaseKey={releaseKey}
            htsgetUrl={releaseData.dataSharingHtsget?.url || ""}
          />
        )}
        {dataSharingAwsAccessPoint && (
          <AwsS3VpcShareForm releaseKey={releaseKey} />
        )}
        {dataSharingGcpStorageIam && (
          <GcpStorageIamShareForm releaseKey={releaseKey} />
        )}
      </VerticalTabs>
    </Box>
  );
};
