import React, { PropsWithChildren, ReactNode, useState } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { ReleaseTypeLocal } from "../../shared-types";
import {
  SharerCopyOutType,
  SharerHtsgetType,
  SharerObjectSigningType,
} from "../../../../../../backend/src/config/config-schema-sharer";
import { trpc } from "../../../../helpers/trpc";
import { ReleasePatchOperationType } from "@umccr/elsa-types";
import classNames from "classnames";
import { EagerErrorBoundary } from "../../../../components/errors";

type HtsgetAccordionContentProps = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
  releasePatchMutator: UseMutationResult<
    ReleaseTypeLocal,
    any,
    ReleasePatchOperationType,
    any
  >;
  htsgetSetting: SharerHtsgetType;
};

export const HtsgetAccordionContent: React.FC<
  PropsWithChildren<HtsgetAccordionContentProps>
> = (props) => {
  const [congenitalHeartDefect, setCongenitalHeartDefect] = useState(
    props.releaseData.dataSharingHtsgetRestrictions.includes(
      "CongenitalHeartDefect"
    )
  );
  const [autism, setAutism] = useState(
    props.releaseData.dataSharingHtsgetRestrictions.includes("Autism")
  );
  const [achromatopsia, setAchromatopsia] = useState(
    props.releaseData.dataSharingHtsgetRestrictions.includes("Achromatopsia")
  );

  const applyHtsgetRestriction =
    trpc.release.applyHtsgetRestriction.useMutation();
  const removeHtsgetRestriction =
    trpc.release.removeHtsgetRestriction.useMutation();

  type HtsgetRestrictionProps = {
    releaseKey: string;
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
                releaseKey: props.releaseKey,
                restriction: props.restriction,
              });
            } else {
              removeHtsgetRestriction.mutate({
                releaseKey: props.releaseKey,
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

  const error = removeHtsgetRestriction.error ?? applyHtsgetRestriction.error;
  const isError =
    removeHtsgetRestriction.isError || applyHtsgetRestriction.isError;

  return (
    <>
      {isError && <EagerErrorBoundary error={error} />}

      <div className="flex flex-col">
        <div className={"pb-2"}>
          htsget is a protocol that allows restricting data sharing to specific
          regions.
        </div>
        <pre className="pb-4">{props.releaseData.dataSharingHtsget?.url}</pre>

        <div className="font-medium">Restrictions</div>
        <HtsgetRestriction
          releaseKey={props.releaseKey}
          label="Congenital Heart Defect"
          setFn={setCongenitalHeartDefect}
          restriction="CongenitalHeartDefect"
          checked={congenitalHeartDefect}
        ></HtsgetRestriction>
        <HtsgetRestriction
          releaseKey={props.releaseKey}
          label="Autism"
          setFn={setAutism}
          restriction="Autism"
          checked={autism}
        ></HtsgetRestriction>
        <HtsgetRestriction
          releaseKey={props.releaseKey}
          label="Achromatopsia"
          setFn={setAchromatopsia}
          restriction="Achromatopsia"
          checked={achromatopsia}
        ></HtsgetRestriction>
      </div>
    </>
  );
};
