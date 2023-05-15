import React, { PropsWithChildren, ReactNode } from "react";
import classNames from "classnames";
import { ErrorBoundary } from "./errors";

type BoxProps = {
  heading: ReactNode;

  applyIsLockedStyle?: boolean;

  applyIsDisabledStyle?: boolean;

  applyIsDisabledMessage?: string;

  errorMessage?: string;
};

export const Box: React.FC<PropsWithChildren<BoxProps>> = ({
  heading,
  applyIsLockedStyle,
  applyIsDisabledStyle,
  applyIsDisabledMessage,
  errorMessage,
  children,
}) => {
  return (
    <div
      className={classNames("card-major w-full", {
        "border-8 border-amber-100": applyIsLockedStyle,
        "border-8 border-gray-400": applyIsDisabledStyle,
      })}
    >
      {applyIsLockedStyle && (
        <div className="w-full bg-amber-100 pb-2 text-center text-xs">
          Editing is disabled whilst release is activated
        </div>
      )}
      {applyIsDisabledStyle && (
        <div className="w-full bg-gray-400 pb-2 text-center text-xs">
          {applyIsDisabledMessage ? applyIsDisabledStyle : "Disabled"}
        </div>
      )}
      <div
        className={classNames("card-body", {
          "sepia-[.3]": applyIsLockedStyle,
          grayscale: applyIsDisabledStyle,
        })}
      >
        <h2 className="card-title">{heading}</h2>
        <ErrorBoundary message={errorMessage} styling={"bg-red-100"}>
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );
};
