import React, { PropsWithChildren } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { ReleaseTypeLocal } from "../../shared-types";
import {
  SharerCopyOutType,
  SharerObjectSigningType,
} from "../../../../../../backend/src/config/config-schema-sharer";
import { trpc } from "../../../../helpers/trpc";
import { ReleasePatchOperationType } from "@umccr/elsa-types";

type ObjectSigningAccordionContentProps = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
  releasePatchMutator: UseMutationResult<
    ReleaseTypeLocal,
    any,
    ReleasePatchOperationType,
    any
  >;
  objectSigningSetting: SharerObjectSigningType;
};

export const ObjectSigningAccordionContent: React.FC<
  PropsWithChildren<ObjectSigningAccordionContentProps>
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

  return (
    <>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Signing Expiry in Hours</span>
        </label>
        <label>{props.objectSigningSetting.maxAgeInSeconds / 60}</label>
      </div>
    </>
  );
};
