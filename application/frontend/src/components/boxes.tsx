import React, { PropsWithChildren, ReactNode } from "react";
import classNames from "classnames";
import { ErrorBoundary } from "./errors";
import { DisabledInputWrapper } from "./disable-input-wrapper";

type BoxProps = {
  heading: ReactNode;
  applyIsDisabledAllInput?: boolean;
  applyIsActivatedLockedStyle?: boolean;
  applyIsDisabledStyle?: boolean;
  applyIsDisabledMessage?: string;
};

/**
 * The apply isDisabled has a higher precedence that the "applyIsActivatedLockedStyle"
 *
 * @param applyIsDisabledAllInput is a boolean and will disable all form of inputs except for `select`. Do take note if you have a table paginator as part of the children
 */
export const Box: React.FC<PropsWithChildren<BoxProps>> = ({
  heading,
  applyIsActivatedLockedStyle,
  applyIsDisabledStyle,
  applyIsDisabledMessage,
  applyIsDisabledAllInput,
  children,
}) => {
  return (
    <div
      className={classNames("card-major w-full", {
        "border-8 border-amber-100": applyIsActivatedLockedStyle,
        "border-8 border-gray-400": applyIsDisabledStyle,
      })}
    >
      <DisabledInputWrapper isInputDisabled={applyIsDisabledAllInput}>
        <>
          {applyIsDisabledStyle ? (
            <div className="w-full bg-gray-400 pb-2 text-center text-xs">
              {applyIsDisabledMessage
                ? applyIsDisabledMessage
                : "You are not allowed to modify this section"}
            </div>
          ) : applyIsActivatedLockedStyle ? (
            <div className="w-full bg-amber-100 pb-2 text-center text-xs">
              Editing is disabled whilst release is activated
            </div>
          ) : (
            <></>
          )}
          <div
            className={classNames("card-body", {
              "grayscale-[75%]": applyIsDisabledStyle,
              "sepia-[.2]": applyIsActivatedLockedStyle,
            })}
          >
            <h2 className="card-title">{heading}</h2>
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </>
      </DisabledInputWrapper>
    </div>
  );
};
