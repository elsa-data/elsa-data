import React, { PropsWithChildren } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { ReleaseTypeLocal } from "../../shared-types";
import { SharerAwsAccessPointType } from "../../../../../../backend/src/config/config-schema-sharer";
import { trpc } from "../../../../helpers/trpc";
import { ReleasePatchOperationType } from "@umccr/elsa-types";

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
    await utils.releaseRouter.getSpecificRelease.invalidate({
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
    props?.releaseData.dataSharingAwsAccessPoint?.installed;

  const isCurrentlyDescriptions = new Set<string>();

  if (isCurrentlyMissingNeededValues)
    isCurrentlyDescriptions.add("missing needed configuration values");
  if (isCurrentlyMutating)
    isCurrentlyDescriptions.add("currently in a mutation operation");
  if (isCurrentlyRunningAnotherJob)
    isCurrentlyDescriptions.add("currently running another job");
  if (isCurrentlyInactiveRelease)
    isCurrentlyDescriptions.add("currently not activated release");
  if (isCurrentlyAlreadyInstalled)
    isCurrentlyDescriptions.add(
      "currently already an access point in place for this release"
    );

  return (
    <>
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
          disabled={props.releasePatchMutator.isLoading}
          onChange={(e) => {
            // we make sure we are only changing to a name that exists in our config
            const newName = Object.keys(
              props.awsAccessPointSetting.allowedVpcs
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
          <option value={""}>{NONE_DISPLAY}</option>
          {Object.entries(props.awsAccessPointSetting.allowedVpcs).map(
            (entry) => (
              <option>{entry[0]}</option>
            )
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
          disabled={
            isCurrentlyRunningAnotherJob ||
            isCurrentlyMissingNeededValues ||
            isCurrentlyMutating ||
            // must be activated
            !props.releaseData.activation ||
            isCurrentlyAlreadyInstalled
          }
          title={`Disabled due to\n${Array.from(
            isCurrentlyDescriptions.values()
          ).join("\n")}`}
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
          disabled={
            isCurrentlyRunningAnotherJob ||
            isCurrentlyMissingNeededValues ||
            isCurrentlyMutating ||
            !isCurrentlyAlreadyInstalled
          }
          title={"Disabled due to "}
        >
          Uninstall
        </button>
      </div>
    </>
  );
};
