import React, { PropsWithChildren } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { ReleaseTypeLocal } from "../../shared-types";
import { SharerAwsAccessPointType } from "../../../../../../backend/src/config/config-schema-sharer";
import { trpc } from "../../../../helpers/trpc";
import { ReleasePatchOperationType } from "@umccr/elsa-types";
import { EagerErrorBoundary } from "../../../../components/errors";

type AwsAccessPointAccordionContentProps = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
  releasePatchMutator: UseMutationResult<
    ReleaseTypeLocal,
    any,
    ReleasePatchOperationType,
    any
  >;
  awsAccessPointSetting: SharerAwsAccessPointType;
  awsAccessPointWorking: boolean;
};

const NONE_DISPLAY = "-- none --";

export const AwsAccessPointAccordionContent: React.FC<
  PropsWithChildren<AwsAccessPointAccordionContentProps>
> = (props) => {
  const utils = trpc.useContext();

  const onSuccess = async () => {
    await utils.release.getSpecificRelease.invalidate({
      releaseKey: props.releaseKey,
    });
    // once we have started the copy out and invalidated the release state - our next render
    // will show a progress bar at the top... we take them there to show it occurring
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  const accessPointInstallTriggerMutate =
    trpc.releaseJob.startAwsAccessPointInstall.useMutation({
      onSuccess: onSuccess,
    });

  const accessPointUninstallTriggerMutate =
    trpc.releaseJob.startAwsAccessPointUninstall.useMutation({
      onSuccess: onSuccess,
    });

  // ALL OUR boolean states that will go into enabling or disabling buttons

  // does the backend have non-empty values for any fields
  const isCurrentlyMissingNeededValues =
    !props.releaseData?.dataSharingAwsAccessPoint?.name ||
    !props.releaseData?.dataSharingAwsAccessPoint?.vpcId ||
    !props.releaseData?.dataSharingAwsAccessPoint?.accountId;

  // if mutators are running then UI bits needs to be disabled until finished
  const isCurrentlyMutating =
    // can't be within our own trigger operation
    accessPointInstallTriggerMutate.isLoading ||
    accessPointUninstallTriggerMutate.isLoading ||
    // can't be started whilst other fields are being mutated
    props.releasePatchMutator.isLoading;

  // there are various system/release level things that can cause us to not want to enable UI
  const isCurrentlyRunningAnotherJob =
    // can't be already running a job
    !!props.releaseData.runningJob;

  //const isCurrentlyNotWorking =
  //  // aws access point needs to be working as a mechanism
  //  !props.awsAccessPointWorking;

  const isCurrentlyInactiveRelease =
    // must be activated
    !props.releaseData.activation;

  const isCurrentlyAlreadyInstalled =
    props?.releaseData?.dataSharingAwsAccessPoint?.installed || false;

  const isInstallDisabledDescriptions = new Set<string>();
  const isUninstallDisabledDescription = new Set<string>();

  if (isCurrentlyMissingNeededValues) {
    const m = "missing needed configuration values";
    isInstallDisabledDescriptions.add(m);
    isUninstallDisabledDescription.add(m);
  }

  if (isCurrentlyRunningAnotherJob) {
    const m = "currently running another job";
    isInstallDisabledDescriptions.add(m);
    isUninstallDisabledDescription.add(m);
  }

  if (isCurrentlyMutating) {
    const m = "currently in a mutation operation";
    isInstallDisabledDescriptions.add(m);
    isUninstallDisabledDescription.add(m);
  }

  if (isCurrentlyInactiveRelease) {
    isInstallDisabledDescriptions.add("release is not activated");
  }

  if (isCurrentlyAlreadyInstalled) {
    isInstallDisabledDescriptions.add(
      "an access point for this release is already installed",
    );
  } else {
    isUninstallDisabledDescription.add(
      "there is no installed access point for this release",
    );
  }

  const isInstallDisabled = isInstallDisabledDescriptions.size > 0;
  console.log("isInstallDisabledDescriptions", isInstallDisabledDescriptions);
  const isUninstallDisabled = isUninstallDisabledDescription.size > 0;
  console.log("isUninstallDisabledDescription", isUninstallDisabledDescription);

  const error =
    accessPointInstallTriggerMutate.error ??
    accessPointUninstallTriggerMutate.error;
  const isError =
    accessPointInstallTriggerMutate.isError ||
    accessPointUninstallTriggerMutate.isError;

  return (
    <>
      {isError && <EagerErrorBoundary error={error} />}
      <div className="form-control flex-grow lg:w-3/4">
        <label className="label">
          <span className="label-text">
            Account/VPC Target{"  "}
            <span className="text-xs">
              (NOTE additions to this list must be managed by the system
              administrators)
            </span>
          </span>
        </label>
        <select
          className="input-bordered input w-full"
          defaultValue={
            props.releaseData?.dataSharingAwsAccessPoint?.name || NONE_DISPLAY
          }
          disabled={
            props.releasePatchMutator.isLoading ||
            // Not allowing to choose other AP when one is already installed
            isCurrentlyAlreadyInstalled
          }
          onChange={(e) => {
            // we make sure we are only changing to a name that exists in our config
            const newName = Object.keys(
              props.awsAccessPointSetting.allowedVpcs,
            ).find((name) => name === e.target.value);

            if (newName) {
              props.releasePatchMutator.mutate({
                op: "replace",
                path: "/dataSharingConfiguration/awsAccessPointName",
                value: newName,
              });
            } else {
              props.releasePatchMutator.mutate({
                op: "replace",
                path: "/dataSharingConfiguration/awsAccessPointName",
                value: "",
              });
            }
          }}
        >
          <option key="none" value={""}>
            {NONE_DISPLAY}
          </option>
          {Object.entries(props.awsAccessPointSetting.allowedVpcs).map(
            (entry, index) => (
              <option key={index}>{entry[0]}</option>
            ),
          )}
        </select>
        <div className="form-control flex-grow">
          <label className="label">
            <span className="label-text">Account Id</span>
          </label>
          <input
            type="text"
            disabled={true}
            className="input-bordered input input-disabled w-full"
            defaultValue={
              props.releaseData.dataSharingAwsAccessPoint?.accountId
            }
          />
        </div>
        <div className="form-control flex-grow">
          <label className="label">
            <span className="label-text">VPC Id</span>
          </label>
          <input
            type="text"
            disabled={true}
            className="input-bordered input input-disabled w-full"
            defaultValue={props.releaseData.dataSharingAwsAccessPoint?.vpcId}
          />
        </div>
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Install AWS Access Point</span>
        </label>
        <button
          type="button"
          className="btn-normal w-fit"
          onClick={() => {
            accessPointInstallTriggerMutate.mutate({
              releaseKey: props.releaseKey,
            });
          }}
          disabled={isInstallDisabled}
          title={
            isInstallDisabled
              ? `Disabled due to\n${Array.from(
                  isInstallDisabledDescriptions.values(),
                ).join("\n")}`
              : undefined
          }
        >
          Install
        </button>
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Uninstall AWS Access Point</span>
        </label>
        <button
          type="button"
          className="btn-normal w-fit"
          onClick={() => {
            accessPointUninstallTriggerMutate.mutate({
              releaseKey: props.releaseKey,
            });
          }}
          disabled={isUninstallDisabled}
          title={
            isUninstallDisabled
              ? `Disabled due to\n${Array.from(
                  isUninstallDisabledDescription.values(),
                ).join("\n")}`
              : undefined
          }
        >
          Uninstall
        </button>
      </div>
    </>
  );
};
