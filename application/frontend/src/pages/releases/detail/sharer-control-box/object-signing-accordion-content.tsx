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
