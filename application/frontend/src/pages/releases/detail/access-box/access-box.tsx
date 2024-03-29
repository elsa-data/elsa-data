import React from "react";
import { ReleaseTypeLocal } from "../../shared-types";
import { VerticalTabs } from "../../../../components/vertical-tabs";
import { Box } from "../../../../components/boxes";
import { ManifestForm } from "./manifest-form";
import { CopyOutForm } from "./copy-out-form";
import { AwsAccessPointForm } from "./aws-access-point-form";
import { GcpStorageIamShareForm } from "./gcp-storage-iam-share-form";
import { HtsgetForm } from "./htsget-form";
import { ObjectSigningForm } from "./object-signing-form";
import { useLoggedInUserConfigRelay } from "../../../../providers/logged-in-user-config-relay-provider";
import { isDiscriminate } from "@umccr/elsa-constants";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

/**
 * A box for the researcher/applicant showing only those mechanism that
 * have been enabled for them.
 */
export const AccessBox: React.FC<Props> = ({ releaseKey, releaseData }) => {
  const { sharers } = useLoggedInUserConfigRelay()!;

  // the settings come from the backend on login and tell us what is fundamentally enabled
  // in the system - if something is not enabled in the config system then we WILL NEVER SHOW IT
  const objectSigningSetting = sharers.find(
    isDiscriminate("type", "object-signing"),
  );
  const copyOutSetting = sharers.find(isDiscriminate("type", "copy-out"));
  const htsgetSetting = sharers.find(isDiscriminate("type", "htsget"));
  const awsAccessPointSetting = sharers.find(
    isDiscriminate("type", "aws-access-point"),
  );

  // there can theoretically be a disconnect between what is enabled in
  // the database (i.e. releaseData.dataSharing*)
  // and what is actually working... from the researcher perspective we require *both*.
  // That is, if someone enables object signing
  // for a release - and then reboots Elsa Data with object signing switched
  // off in the config - that disabled setting will disable
  // it from the perspective of the researcher here
  const dataSharingObjectSigning =
    !!objectSigningSetting &&
    !!releaseData.dataSharingObjectSigning &&
    !objectSigningSetting?.notWorkingReason;
  const dataSharingCopyOut =
    !!copyOutSetting &&
    !!releaseData.dataSharingCopyOut &&
    !copyOutSetting?.notWorkingReason;
  const dataSharingHtsget =
    !!htsgetSetting &&
    !!releaseData.dataSharingHtsget &&
    !htsgetSetting?.notWorkingReason;
  const dataSharingAwsAccessPoint =
    !!awsAccessPointSetting &&
    !!releaseData.dataSharingAwsAccessPoint &&
    !awsAccessPointSetting?.notWorkingReason;
  // const dataSharingGcpStorageIam = !!releaseData.dataSharingGcpStorageIam;

  const tabHeadings: string[] = ["Manifest"];

  if (dataSharingObjectSigning) tabHeadings.push("Object Signing");
  if (dataSharingCopyOut) tabHeadings.push("Copy Out");
  if (dataSharingHtsget) tabHeadings.push("htsget");
  if (dataSharingAwsAccessPoint) tabHeadings.push("AWS Access Point");
  // if (dataSharingGcpStorageIam) tabHeadings.push("GCP Storage IAM");

  return (
    <Box heading="Access Data" applyIsDisabledStyle={!releaseData.activation}>
      <VerticalTabs tabHeadings={tabHeadings}>
        {/* manifest download is always present */}
        <ManifestForm releaseKey={releaseKey} releaseData={releaseData} />
        {dataSharingObjectSigning && (
          <ObjectSigningForm
            releaseKey={releaseKey}
            releaseData={releaseData}
            objectSigningSetting={objectSigningSetting}
          />
        )}
        {dataSharingCopyOut && (
          <CopyOutForm releaseKey={releaseKey} releaseData={releaseData} />
        )}
        {dataSharingHtsget && (
          <HtsgetForm
            releaseKey={releaseKey}
            releaseData={releaseData}
            htsgetUrl={releaseData.dataSharingHtsget?.url || ""}
          />
        )}
        {dataSharingAwsAccessPoint && (
          <AwsAccessPointForm
            releaseKey={releaseKey}
            releaseData={releaseData}
          />
        )}
        {/* {dataSharingGcpStorageIam && (
          <GcpStorageIamShareForm releaseKey={releaseKey} />
        )} */}
      </VerticalTabs>
    </Box>
  );
};
