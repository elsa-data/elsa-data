import React, { PropsWithChildren, ReactNode, useState } from "react";
import classNames from "classnames";
import { useMutation } from "@tanstack/react-query";
import { Box } from "../../../../components/boxes";
import { ReleaseTypeLocal } from "../../shared-types";
import {
  LeftDiv,
  RhSection,
  RightDiv,
} from "../../../../components/rh/rh-structural";
import { RhChecks } from "../../../../components/rh/rh-checks";
import { axiosPatchOperationMutationFn } from "../../queries";
import { trpc } from "../../../../helpers/trpc";
import { isDiscriminate } from "@umccr/elsa-constants";
import { useLoggedInUserConfigRelay } from "../../../../providers/logged-in-user-config-relay-provider";
import { SharingConfigurationAccordion } from "./sharing-configuration-accordion";
import { CopyOutAccordionContent } from "./copy-out-accordion-content";
import { ObjectSigningAccordionContent } from "./object-signing-accordion-content";
import { HtsgetAccordionContent } from "./htsget-accordion-content";
import { AwsAccessPointAccordionContent } from "./aws-access-point-accordion-content";
import { EagerErrorBoundary } from "../../../../components/errors";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
  isAllowEdit: boolean;
};

/**
 * The control panel for data owner that allows enabling/triggering
 * different sharers.
 *
 * @param releaseKey
 * @param releaseData
 * @param isEditable
 * @constructor
 */
export const SharerControlBox: React.FC<Props> = ({
  releaseKey,
  releaseData,
  isAllowEdit = false,
}) => {
  const { sharers } = useLoggedInUserConfigRelay()!;
  const utils = trpc.useContext();

  // a mutator that can alter any field set up using our REST PATCH mechanism
  // the argument to the mutator needs to be a single ReleasePatchOperationType operation
  const releasePatchMutate = useMutation(
    axiosPatchOperationMutationFn(`/api/releases/${releaseKey}`),
    {
      onSuccess: async () =>
        await utils.release.getSpecificRelease.invalidate({
          releaseKey: releaseKey,
        }),
    }
  );

  // the settings come from the backend on login and tell us what is fundamentally enabled
  // in the system
  const objectSigningSetting = sharers.find(
    isDiscriminate("type", "object-signing")
  );
  const copyOutSetting = sharers.find(isDiscriminate("type", "copy-out"));
  const htsgetSetting = sharers.find(isDiscriminate("type", "htsget"));
  const awsAccessPointSetting = sharers.find(
    isDiscriminate("type", "aws-access-point")
  );

  // the "enabled" fields are whether the custodian has checked the checkbox..
  const objectSigningEnabled = !!releaseData.dataSharingObjectSigning;
  const copyOutEnabled = !!releaseData.dataSharingCopyOut;
  const htsgetEnabled = !!releaseData.dataSharingHtsget;
  const awsAccessPointEnabled = !!releaseData.dataSharingAwsAccessPoint;
  // const gcpStorageIamEnabled = !!releaseData.dataSharingGcpStorageIam;

  const error = releasePatchMutate.error;
  const isError = releasePatchMutate.isError;

  return (
    <Box
      heading="Data Sharing Control"
      applyIsDisabledStyle={!isAllowEdit}
      applyIsDisabledAllInput={!isAllowEdit}
    >
      <RhSection>
        <LeftDiv
          heading={"Mechanism"}
          extra={
            "The technical mechanisms by which data will be shared must be enabled " +
            "according to data transfer agreements and organisation policy"
          }
        />
        <RightDiv>
          <RhChecks label="Researcher Access Via">
            {isError && <EagerErrorBoundary error={error} />}

            <>
              {objectSigningSetting && (
                <SharingConfigurationAccordion
                  mutator={releasePatchMutate}
                  path="/dataSharingConfiguration/objectSigningEnabled"
                  label="Object Signing"
                  current={objectSigningEnabled}
                  notWorkingReason={objectSigningSetting.notWorkingReason}
                >
                  <ObjectSigningAccordionContent
                    releaseKey={releaseKey}
                    releaseData={releaseData}
                    releasePatchMutator={releasePatchMutate}
                    objectSigningSetting={objectSigningSetting}
                  />
                </SharingConfigurationAccordion>
              )}

              {copyOutSetting && (
                <SharingConfigurationAccordion
                  mutator={releasePatchMutate}
                  path="/dataSharingConfiguration/copyOutEnabled"
                  label="Copy Out"
                  current={copyOutEnabled}
                  notWorkingReason={copyOutSetting.notWorkingReason}
                >
                  <CopyOutAccordionContent
                    releaseKey={releaseKey}
                    releaseData={releaseData}
                    releasePatchMutator={releasePatchMutate}
                    copyOutSetting={copyOutSetting}
                    copyOutWorking={!!copyOutSetting.notWorkingReason}
                  />
                </SharingConfigurationAccordion>
              )}

              {htsgetSetting && (
                <SharingConfigurationAccordion
                  mutator={releasePatchMutate}
                  path="/dataSharingConfiguration/htsgetEnabled"
                  label="Htsget"
                  current={htsgetEnabled}
                  notWorkingReason={htsgetSetting.notWorkingReason}
                >
                  <HtsgetAccordionContent
                    releaseKey={releaseKey}
                    releaseData={releaseData}
                    releasePatchMutator={releasePatchMutate}
                    htsgetSetting={htsgetSetting}
                  />
                </SharingConfigurationAccordion>
              )}

              {awsAccessPointSetting && (
                <SharingConfigurationAccordion
                  mutator={releasePatchMutate}
                  path="/dataSharingConfiguration/awsAccessPointEnabled"
                  label="AWS Access Point"
                  current={awsAccessPointEnabled}
                  notWorkingReason={awsAccessPointSetting.notWorkingReason}
                >
                  <AwsAccessPointAccordionContent
                    releaseKey={releaseKey}
                    releaseData={releaseData}
                    releasePatchMutator={releasePatchMutate}
                    awsAccessPointSetting={awsAccessPointSetting}
                    awsAccessPointWorking={
                      !!awsAccessPointSetting.notWorkingReason
                    }
                  />
                </SharingConfigurationAccordion>
              )}
            </>
          </RhChecks>
        </RightDiv>
      </RhSection>
    </Box>
  );
};
