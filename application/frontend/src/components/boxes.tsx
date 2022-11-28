import React, { PropsWithChildren, ReactNode } from "react";
import classNames from "classnames";
import { ErrorBoundary } from "./error-boundary";

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
    <ErrorBoundary message={errorMessage}>
      <div className="w-full py-3">
        <div className="bg-white border rounded-b-xl shadow">
          <div
            className={classNames(
              "border-b p-3 bg-gradient-to-r",
              headerFromColour
            )}
          >
            <h5 className="font-bold uppercase text-gray-600">{heading}</h5>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export const BoxNoPad: React.FC<PropsWithChildren<BoxProps>> = ({
  heading,
  headerFromColour = "from-slate-300",
  errorMessage,
  children,
}) => {
  return (
    <ErrorBoundary message={errorMessage}>
      <div className="w-full py-3">
        <div className="bg-white border rounded-b-xl shadow">
          <div
            className={classNames(
              "border-b p-3 bg-gradient-to-r",
              headerFromColour
            )}
          >
            <h5 className="font-bold uppercase text-gray-600">{heading}</h5>
          </div>
          <div className="overflow-auto">{children}</div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
