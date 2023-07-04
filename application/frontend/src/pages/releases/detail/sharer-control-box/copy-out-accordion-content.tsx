import React, { PropsWithChildren } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { ReleaseTypeLocal } from "../../shared-types";
import { SharerCopyOutType } from "../../../../../../backend/src/config/config-schema-sharer";
import { trpc } from "../../../../helpers/trpc";
import { ReleasePatchOperationType } from "@umccr/elsa-types";
import { EagerErrorBoundary } from "../../../../components/errors";

type CopyOutAccordionContentProps = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
  releasePatchMutator: UseMutationResult<
    ReleaseTypeLocal,
    any,
    ReleasePatchOperationType,
    any
  >;
  copyOutSetting: SharerCopyOutType;
  copyOutWorking: boolean;
};

export const CopyOutAccordionContent: React.FC<
  PropsWithChildren<CopyOutAccordionContentProps>
> = (props) => {
  const utils = trpc.useContext();

  const copyOutTriggerMutate = trpc.releaseJob.startCopyOut.useMutation({
    onSuccess: async () => {
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
    },
  });

  const error = copyOutTriggerMutate.error;
  const isError = copyOutTriggerMutate.isError;

  return (
    <>
      {isError && <EagerErrorBoundary error={error} />}

      <div className="form-control flex-grow lg:w-3/4">
        <label className="label">
          <span className="label-text">
            Destination for Copy Out{" "}
            <span className="text-xs">
              (NOTE this field can be edited by the researchers as well)
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
            // only attempt a mutate if we think the textbox has changed
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
          <span className="label-text">
            Start a Background Copy{" "}
            <span className="text-xs">(NOTE these jobs can run for hours)</span>
          </span>
        </label>
        <button
          type="button"
          className="btn-normal w-fit"
          onClick={() => {
            copyOutTriggerMutate.mutate({
              releaseKey: props.releaseKey,
              destinationBucket:
                props.releaseData.dataSharingCopyOut?.destinationLocation || "",
            });
          }}
          disabled={
            // can't be already running a job
            !!props.releaseData.runningJob ||
            // must be activated
            !props.releaseData.activation ||
            // can't be within our own trigger operation
            copyOutTriggerMutate.isLoading ||
            // can't be started whilst other fields are being mutated
            props.releasePatchMutator.isLoading ||
            // copy out needs to be working as a mechanism
            props.copyOutWorking
          }
        >
          Copy Out
        </button>
      </div>
    </>
  );
};
