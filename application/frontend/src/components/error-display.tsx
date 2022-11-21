import React, { ReactNode } from "react";

export type ErrorDisplayProps = {
  message: ReactNode | undefined;
};

/**
 * Display an error message.
 */
export const ErrorDisplay = ({
  message,
}: ErrorDisplayProps): JSX.Element | null => {
  return message ? (
    <div className="p-4 mx-4 my-3 text-sm text-red-700 bg-red-100 rounded-lg">
      <span>{message}</span>
    </div>
  ) : null;
};
