import React, { PropsWithChildren } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { ReleaseTypeLocal } from "../../shared-types";
import {
  SharerAwsAccessPointType,
  SharerCopyOutType,
} from "../../../../../../backend/src/config/config-schema-sharer";
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
    trpc.releaseJob.startAccessPointInstall.useMutation({
      onSuccess: onSuccess,
    });

  const accessPointUninstallTriggerMutate =
    trpc.releaseJob.startAccessPointUninstall.useMutation({
      onSuccess: onSuccess,
    });

  return (
    <>
      <div className="form-control flex-grow lg:w-3/4">
        <label className="label">
          <span className="label-text">
            Account/VPC Target{" "}
            <span className="text-xs">
              (NOTE additions to this list must be managed by the system
              administrators)
            </span>
          </span>
        </label>
        <input
          type="text"
          className="input-bordered input w-full"
          defaultValue={
            props.releaseData.dataSharingCopyOut?.destinationLocation
          }
          disabled={props.releasePatchMutator.isLoading}
          onBlur={(e) => {
            // only attempt a mutation if we think the textbox has changed
            if (
              e.target.value !=
              props.releaseData.dataSharingCopyOut?.destinationLocation
            )
              props.releasePatchMutator.mutate({
                op: "replace",
                path: "/dataSharingConfiguration/copyOutDestinationLocation",
                value: e.target.value,
              });
          }}
        />
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
              accounts: ["12345"],
              vpcId: "vpc-12312343",
            });
          }}
          disabled={
            // can't be already running a job
            !!props.releaseData.runningJob ||
            // must be activated
            !props.releaseData.activation ||
            // can't be within our own trigger operation
            accessPointInstallTriggerMutate.isLoading ||
            accessPointUninstallTriggerMutate.isLoading ||
            // can't be started whilst other fields are being mutated
            props.releasePatchMutator.isLoading ||
            // aws access point needs to be working as a mechanism
            props.awsAccessPointWorking
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
          disabled={
            // can't be already running a job
            !!props.releaseData.runningJob ||
            // can't be within our own trigger operation
            accessPointInstallTriggerMutate.isLoading ||
            accessPointUninstallTriggerMutate.isLoading ||
            // can't be started whilst other fields are being mutated
            props.releasePatchMutator.isLoading ||
            // aws access point needs to be working as a mechanism
            props.awsAccessPointWorking
          }
        >
          Uninstall
        </button>
      </div>

      <div className="form-control flex-grow self-end">
        <label className="label">
          <span className="label-text">Account Id</span>
        </label>
        <input
          type="text"
          className="input-bordered input input-disabled w-full"
          defaultValue={props.releaseData.dataSharingAwsAccessPoint?.accountId}
        />
      </div>
      <div className="form-control flex-grow self-end">
        <label className="label">
          <span className="label-text">VPC Id</span>
        </label>
        <input
          type="text"
          className="input-bordered input input-disabled w-full"
          defaultValue={props.releaseData.dataSharingAwsAccessPoint?.vpcId}
        />
      </div>
    </>
  );
};
