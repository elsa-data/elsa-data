import React, { PropsWithChildren, ReactNode, useState } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { ReleaseTypeLocal } from "../../shared-types";
import { SharerHtsgetType } from "../../../../../../backend/src/config/config-schema-sharer";
import { ReleasePatchOperationType } from "../../../../../../backend/src/shared/schemas-release-operations";
import classNames from "classnames";
import { EagerErrorBoundary } from "../../../../components/errors";
import { useTRPC } from "../../../../helpers/trpc-modern.ts";

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
  const trpc = useTRPC();

  const [congenitalHeartDefect, setCongenitalHeartDefect] = useState(
    props.releaseData.dataSharingHtsgetRestrictions.includes(
      "CongenitalHeartDefect",
    ),
  );
  const [autism, setAutism] = useState(
    props.releaseData.dataSharingHtsgetRestrictions.includes("Autism"),
  );
  const [achromatopsia, setAchromatopsia] = useState(
    props.releaseData.dataSharingHtsgetRestrictions.includes("Achromatopsia"),
  );

  const applyHtsgetRestrictionOptions =
    trpc.release.applyHtsgetRestriction.mutationOptions();
  const applyHtsgetRestriction = useMutation(applyHtsgetRestrictionOptions);
  const removeHtsgetRestrictionOptions =
    trpc.release.removeHtsgetRestriction.mutationOptions();
  const removeHtsgetRestriction = useMutation(removeHtsgetRestrictionOptions);

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
              applyHtsgetRestriction.isPending ||
              removeHtsgetRestriction.isPending,
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
