import React from "react";

export type ErrorDisplayProps = {
  message: JSX.Element;
};

/**
 * Display an error message.
 */
export const ErrorDisplay = ({ message }: ErrorDisplayProps): JSX.Element => {
  return (
    <div>
      <p>{message}</p>
      <p>
        If you have landed on this page by following links within Elsa Data -
        then this is an internal bug and we would be grateful if you could
        report it.
      </p>
      <p>
        If you have just been randomly typing in URLs then you have got what you
        deserved!
      </p>
    </div>
  );
};
