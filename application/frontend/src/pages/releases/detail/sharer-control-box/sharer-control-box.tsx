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
import { InputWrapper } from "../../../../components/input-wrapper";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
  isEditable: boolean;
};

/**
 * The control panel for data owner that allows enabling/triggering
 * different sharers.
 *
 * @param releaseKey
 * @param releaseData
 * @constructor
 */
export const SharerControlBox: React.FC<Props> = ({
  releaseKey,
  releaseData,
  isEditable = false,
}) => {
  const { sharers } = useLoggedInUserConfigRelay()!;
  const utils = trpc.useContext();

  // a mutator that can alter any field set up using our REST PATCH mechanism
  // the argument to the mutator needs to be a single ReleasePatchOperationType operation
  const releasePatchMutate = useMutation(
    axiosPatchOperationMutationFn(`/api/releases/${releaseKey}`),
    {
      onSuccess: async () =>
        await utils.releaseRouter.getSpecificRelease.invalidate({
          releaseKey: releaseKey,
        }),
    }
  );

  const [congenitalHeartDefect, setCongenitalHeartDefect] = useState(
    releaseData.htsgetRestrictions.includes("CongenitalHeartDefect")
  );
  const [autism, setAutism] = useState(
    releaseData.htsgetRestrictions.includes("Autism")
  );
  const [achromatopsia, setAchromatopsia] = useState(
    releaseData.htsgetRestrictions.includes("Achromatopsia")
  );

  const applyHtsgetRestriction =
    trpc.releaseRouter.applyHtsgetRestriction.useMutation();
  const removeHtsgetRestriction =
    trpc.releaseRouter.removeHtsgetRestriction.useMutation();

  const copyOutTriggerMutate = trpc.releaseJob.startCopyOut.useMutation({
    onSuccess: async () => {
      await utils.releaseRouter.getSpecificRelease.invalidate({
        releaseKey: releaseKey,
      });
      // once we have started the copy out and invalidated the release state - our next render
      // will show a progress bar at the top... we take them there to show it occurring
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    },
  });

  type SharingConfigurationAccordionProps = {
    label: ReactNode;
    path:
      | "/dataSharingConfiguration/objectSigningEnabled"
      | "/dataSharingConfiguration/copyOutEnabled"
      | "/dataSharingConfiguration/htsgetEnabled"
      | "/dataSharingConfiguration/awsAccessPointEnabled"
      | "/dataSharingConfiguration/gcpStorageIamEnabled";
    current: boolean;
    notWorkingReason: string | undefined;
  };
  const SharingConfigurationAccordion: React.FC<
    PropsWithChildren<SharingConfigurationAccordionProps>
  > = (props) => (
    <div
      tabIndex={0}
      className={classNames(
        "rounded-box collapse border border-base-300 bg-base-100",
        {
          "collapse-open": props.current,
          "collapse-close": !props.current,
        }
      )}
    >
      <div className="collapse-title text-xl font-medium">
        {props.notWorkingReason && (
          <div className="alert alert-error mb-3">
            <div className="flex flex-col items-start">
              <p className="text-sm">{props.notWorkingReason}</p>
              <p className="text-xs">
                Whilst this method can be enabled - it will not function as an
                actual sharing mechanism until the underlying configuration
                problem is fixed.
              </p>
            </div>
          </div>
        )}
        <div className={classNames("form-control", "items-start", "space-x-2")}>
          <label className="label cursor-pointer">
            <input
              disabled={!isEditable}
              type="checkbox"
              className={classNames(
                "checkbox-accent checkbox checkbox-sm mr-2",
                { "opacity-50": releasePatchMutate.isLoading }
              )}
              checked={props.current}
              onChange={(e) => {
                releasePatchMutate.mutate({
                  op: "replace",
                  path: props.path,
                  value: !props.current,
                });
              }}
            />
            <span className="label-text">{props.label}</span>
          </label>
        </div>
      </div>
      <div className="collapse-content flex flex-col items-stretch">
        {props.children}
      </div>
    </div>
  );

  type HtsgetRestrictionProps = {
    label: ReactNode;
    restriction: "CongenitalHeartDefect" | "Autism" | "Achromatopsia";
    setFn: (restriction: boolean) => void;
    checked: boolean;
  };
  const HtsgetRestriction: React.FC<
    PropsWithChildren<HtsgetRestrictionProps>
  > = (props) => (
    <div className="form-control items-start font-medium">
      <label className="label cursor-pointer">
        <input
          type="checkbox"
          checked={props.checked}
          onChange={(e) => {
            props.setFn(e.target.checked);

            if (e.target.checked) {
              applyHtsgetRestriction.mutate({
                releaseKey,
                restriction: props.restriction,
              });
            } else {
              removeHtsgetRestriction.mutate({
                releaseKey,
                restriction: props.restriction,
              });
            }
          }}
          className={classNames("checkbox-accent checkbox checkbox-sm mr-2", {
            "opacity-50":
              applyHtsgetRestriction.isLoading ||
              removeHtsgetRestriction.isLoading,
          })}
        />
        <span className="label-text">{props.label}</span>
      </label>
    </div>
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

  const error = releasePatchMutate.error ?? copyOutTriggerMutate.error;
  const isError = releasePatchMutate.isError || copyOutTriggerMutate.isError;

  return (
    <Box heading="Data Sharing Control">
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
            <InputWrapper isDisabledChildrenInput={!isEditable}>
              <>
                {objectSigningSetting && (
                  <SharingConfigurationAccordion
                    path="/dataSharingConfiguration/objectSigningEnabled"
                    label="Object Signing"
                    current={objectSigningEnabled}
                    notWorkingReason={objectSigningSetting.notWorkingReason}
                  >
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Signing Expiry in Hours
                        </span>
                      </label>
                      <label>{objectSigningSetting.maxAgeInSeconds / 60}</label>
                    </div>
                  </SharingConfigurationAccordion>
                )}

                {copyOutSetting && (
                  <SharingConfigurationAccordion
                    path="/dataSharingConfiguration/copyOutEnabled"
                    label="Copy Out"
                    current={copyOutEnabled}
                    notWorkingReason={copyOutSetting.notWorkingReason}
                  >
                    <div className="form-control flex-grow lg:w-3/4">
                      <label className="label">
                        <span className="label-text">
                          Destination for Copy Out{" "}
                          <span className="text-xs">
                            (NOTE this field can be edited by the researchers as
                            well)
                          </span>
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input-bordered input w-full"
                        defaultValue={
                          releaseData.dataSharingCopyOut?.destinationLocation
                        }
                        disabled={releasePatchMutate.isLoading}
                        onBlur={(e) =>
                          releasePatchMutate.mutate({
                            op: "replace",
                            path: "/dataSharingConfiguration/copyOutDestinationLocation",
                            value: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Start a Background Copy{" "}
                          <span className="text-xs">
                            (NOTE these jobs can run for hours)
                          </span>
                        </span>
                      </label>
                      <button
                        type="button"
                        className="btn-normal w-fit"
                        onClick={() => {
                          copyOutTriggerMutate.mutate({
                            releaseKey: releaseKey,
                            destinationBucket:
                              releaseData.dataSharingCopyOut
                                ?.destinationLocation || "",
                          });
                        }}
                        disabled={
                          // can't be already running a job
                          !!releaseData.runningJob ||
                          // must be activated
                          !releaseData.activation ||
                          // can't be within our own trigger operation
                          copyOutTriggerMutate.isLoading ||
                          // can't be started whilst other fields are being mutated
                          releasePatchMutate.isLoading ||
                          // copy out needs to be working as a mechanism
                          !!copyOutSetting.notWorkingReason
                        }
                      >
                        Copy Out
                      </button>
                    </div>
                  </SharingConfigurationAccordion>
                )}

                {htsgetSetting && (
                  <SharingConfigurationAccordion
                    path="/dataSharingConfiguration/htsgetEnabled"
                    label="Htsget"
                    current={htsgetEnabled}
                    notWorkingReason={htsgetSetting.notWorkingReason}
                  >
                    <div className="flex flex-col">
                      <div className={"pb-2"}>
                        htsget is a protocol that allows restricting data
                        sharing to specific regions.
                      </div>
                      <pre className="pb-4">
                        {releaseData.dataSharingHtsget?.url}
                      </pre>

                      <div className="font-medium">Restrictions</div>
                      <HtsgetRestriction
                        label="Congenital Heart Defect"
                        setFn={setCongenitalHeartDefect}
                        restriction="CongenitalHeartDefect"
                        checked={congenitalHeartDefect}
                      ></HtsgetRestriction>
                      <HtsgetRestriction
                        label="Autism"
                        setFn={setAutism}
                        restriction="Autism"
                        checked={autism}
                      ></HtsgetRestriction>
                      <HtsgetRestriction
                        label="Achromatopsia"
                        setFn={setAchromatopsia}
                        restriction="Achromatopsia"
                        checked={achromatopsia}
                      ></HtsgetRestriction>
                    </div>
                  </SharingConfigurationAccordion>
                )}

                {awsAccessPointSetting && (
                  <SharingConfigurationAccordion
                    path="/dataSharingConfiguration/awsAccessPointEnabled"
                    label="AWS Access Point"
                    current={awsAccessPointEnabled}
                    notWorkingReason={awsAccessPointSetting.notWorkingReason}
                  >
                    <div className="form-control flex-grow self-end">
                      <label className="label">
                        <span className="label-text">Account Id</span>
                      </label>
                      <input
                        type="text"
                        className="input-bordered input input-disabled w-full"
                        defaultValue={
                          releaseData.dataSharingAwsAccessPoint?.accountId
                        }
                      />
                    </div>
                    <div className="divider divider-horizontal"></div>
                    <div className="form-control flex-grow self-end">
                      <label className="label">
                        <span className="label-text">VPC Id</span>
                      </label>
                      <input
                        type="text"
                        className="input-bordered input input-disabled w-full"
                        defaultValue={
                          releaseData.dataSharingAwsAccessPoint?.vpcId
                        }
                      />
                    </div>
                    <div className="divider divider-horizontal"></div>
                    <div className="form-control flex-grow self-end">
                      <label className="label">
                        <span className="label-text">
                          Install Cloud Formation
                        </span>
                      </label>
                      <button
                        type="button"
                        className="btn-normal"
                        disabled={true}
                      >
                        Install
                      </button>
                    </div>
                  </SharingConfigurationAccordion>
                )}

                {/*{features.has(FEATURE_DATA_SHARING_GCP_IAM) && (
              <SharingConfigurationAccordion
                path="/dataSharingConfiguration/gcpStorageIamEnabled"
                label="GCP Storage IAM"
                current={gcpStorageIamEnabled}
              >
                <div className="form-control flex-grow self-end">
                  <label className="label">
                    <span className="label-text">Users</span>
                  </label>
                  <input
                    type="text"
                    className="input-bordered input input-disabled w-full"
                    defaultValue={releaseData.dataSharingGcpStorageIam?.users.join(
                      " "
                    )}
                  />
                </div>
                <div className="divider divider-horizontal"></div>
                <div className="form-control flex-grow self-end">
                  <label className="label">
                    <span className="label-text">Apply</span>
                    <span className="label-text-alt">
                      (running time can be minutes)
                    </span>
                  </label>
                  <button type="button" className="btn-normal" disabled={true}>
                    Apply
                  </button>
                </div>
              </SharingConfigurationAccordion>
            )} */}
              </>
            </InputWrapper>
          </RhChecks>
        </RightDiv>
      </RhSection>
    </Box>
  );
};
