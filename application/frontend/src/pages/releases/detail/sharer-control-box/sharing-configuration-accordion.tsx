import React, { PropsWithChildren, ReactNode } from "react";
import classNames from "classnames";
import { UseMutationResult } from "@tanstack/react-query";
import { ReleaseTypeLocal } from "../../shared-types";

type SharingConfigurationAccordionProps = {
  mutator: UseMutationResult<ReleaseTypeLocal, any, any, any>;
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

/**
 * A collapsible accordion box that holds a sharer mechanism.
 *
 * The accordion expand/contracts whilst setting a backend field
 * that enables/disables the particular sharing mechanism.
 *
 * @param props
 * @constructor
 */
export const SharingConfigurationAccordion: React.FC<
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
            type="checkbox"
            className={classNames("checkbox-accent checkbox checkbox-sm mr-2", {
              "opacity-50": props.mutator.isLoading,
            })}
            checked={props.current}
            onChange={() => {
              props.mutator.mutate({
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
