import React, { PropsWithChildren, ReactNode } from "react";
import classNames from "classnames";
import { ErrorBoundary } from "./errors";

type BoxProps = {
  heading: ReactNode;
  headerFromColour?: string;
  errorMessage?: string;
};

export const Box: React.FC<PropsWithChildren<BoxProps>> = ({
  heading,
  headerFromColour = "from-slate-300",
  errorMessage,
  children,
}) => {
  return (
    <div className="card-major w-full">
      <div className="card-body">
        <h2 className="card-title">{heading}</h2>
        <ErrorBoundary message={errorMessage} styling={"bg-red-100"}>
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );
};

{
  /*    <div className="w-full py-3">
      <div className="rounded-b-xl border bg-white shadow">
        <div
          className={classNames(
            "border-b bg-gradient-to-r p-3",
            headerFromColour
          )}
        >
          <h5 className="font-bold uppercase text-gray-600">{heading}</h5>
        </div>
      </div>
    </div>*/
}

export const BoxNoPad: React.FC<PropsWithChildren<BoxProps>> = ({
  heading,
  headerFromColour = "from-slate-300",
  errorMessage,
  children,
}) => {
  return (
    <div className="w-full py-3">
      <div className="rounded-b-xl border bg-white shadow">
        <div
          className={classNames(
            "border-b bg-gradient-to-r p-3",
            headerFromColour
          )}
        >
          <h5 className="font-bold uppercase text-gray-600">{heading}</h5>
        </div>
        <ErrorBoundary message={errorMessage} styling={"bg-red-100"}>
          <div className="overflow-visible">{children}</div>
        </ErrorBoundary>
      </div>
    </div>
  );
};
