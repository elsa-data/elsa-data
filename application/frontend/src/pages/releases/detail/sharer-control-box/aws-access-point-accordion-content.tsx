import React, { PropsWithChildren, useState } from "react";
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

  const [accessPointNameInput, setAccessPointNameInput] = useState<string>(
    props.releaseData?.dataSharingAwsAccessPoint?.name || NONE_DISPLAY,
  );
  const accessPointConfig =
    props.awsAccessPointSetting.allowedVpcs[accessPointNameInput];

  // There is a possibility that there is an active access point but it is no longer in the configuration
  const isActiveAccessPointButNoConfig =
    !Object.keys(props.awsAccessPointSetting.allowedVpcs).find(
      (name) => name === accessPointNameInput,
    ) && props.releaseData?.dataSharingAwsAccessPoint?.installed;

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
    !accessPointConfig?.vpcId || !accessPointConfig?.accountId;

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
  const isVPCOptionDisabledDescription = new Set<string>();

  if (isCurrentlyMissingNeededValues) {
    const m = "missing needed configuration values";
    isInstallDisabledDescriptions.add(m);
    // isUninstallDisabledDescription.add(m);
  }

  if (isCurrentlyRunningAnotherJob) {
    const m = "currently running another job";
    isInstallDisabledDescriptions.add(m);
    isUninstallDisabledDescription.add(m);
    isVPCOptionDisabledDescription.add(m);
  }

  if (isCurrentlyMutating) {
    const m = "currently in a mutation operation";
    isInstallDisabledDescriptions.add(m);
    isUninstallDisabledDescription.add(m);
    isVPCOptionDisabledDescription.add(m);
  }

  if (isCurrentlyInactiveRelease) {
    isInstallDisabledDescriptions.add("release is not activated");
  }

  if (isCurrentlyAlreadyInstalled) {
    isInstallDisabledDescriptions.add(
      "an access point for this release is already installed",
    );
    isVPCOptionDisabledDescription.add(
      "options can be selected when there is no active access point installed",
    );
  } else {
    isUninstallDisabledDescription.add(
      "there is no installed access point for this release",
    );
  }

  const isInstallDisabled = isInstallDisabledDescriptions.size > 0;
  const isUninstallDisabled = isUninstallDisabledDescription.size > 0;
  const isVPCOptionDisabled = isVPCOptionDisabledDescription.size > 0;

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
          value={accessPointNameInput}
          onChange={(e) => {
            setAccessPointNameInput(e.target.value);
          }}
        >
          {/* We want to show the active access point despite no longer in the option/VPCconfig */}
          {isActiveAccessPointButNoConfig && (
            <option
              key="installed-but-removed"
              value={accessPointNameInput}
              disabled={isVPCOptionDisabled}
            >
              {`${accessPointNameInput} *`}
            </option>
          )}
          <option key="none" value={""} disabled={isVPCOptionDisabled}>
            {NONE_DISPLAY}
          </option>
          {Object.entries(props.awsAccessPointSetting.allowedVpcs).map(
            (entry, index) => (
              <option key={index} disabled={isVPCOptionDisabled}>
                {entry[0]}
              </option>
            ),
          )}
        </select>

        {isActiveAccessPointButNoConfig && (
          <span className="label-text-alt text-slate-400 mt-2">
            {`*This access point is installed but the configuration was removed`}
          </span>
        )}

        {isVPCOptionDisabled && (
          <span className="label-text-alt text-slate-400 mt-2">
            {`(Disabled: ${Array.from(
              isVPCOptionDisabledDescription.values(),
            ).join(", ")})`}
          </span>
        )}
        <div className="form-control flex-grow">
          <label className="label">
            <span className="label-text">Account Id</span>
          </label>
          <input
            type="text"
            disabled={true}
            className="input-bordered input input-disabled w-full"
            value={accessPointConfig?.accountId ?? ""}
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
            value={accessPointConfig?.vpcId ?? ""}
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
              awsAccessPointName: accessPointNameInput,
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

        {isInstallDisabled && (
          <span className="label-text-alt text-slate-400 mt-2">
            {`(Disabled: ${Array.from(
              isInstallDisabledDescriptions.values(),
            ).join(", ")})`}
          </span>
        )}
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
        {isUninstallDisabled && (
          <span className="label-text-alt text-slate-400 mt-2">
            {`(Disabled: ${Array.from(
              isUninstallDisabledDescription.values(),
            ).join(", ")})`}
          </span>
        )}
      </div>
    </>
  );
};
