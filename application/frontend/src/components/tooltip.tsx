import React, { ReactNode } from "react";
import classNames from "classnames";

export type ToolTipProps = {
  trigger: ReactNode;
  applyCSS?: string;
  description: ReactNode;
};

/**
 * Tooltip shown on hover.
 */
export const ToolTip = ({
  trigger,
  applyCSS,
  description,
}: ToolTipProps): JSX.Element => {
  return (
    <div
      className={classNames("group/tooltip relative inline-block", applyCSS)}
    >
      {trigger}
      <span
        className="text-normal absolute -left-5 -top-2 hidden -translate-y-full items-center whitespace-nowrap rounded-lg
          bg-gray-600/75 px-2 py-1 text-center text-sm normal-case text-white group-hover/tooltip:flex"
      >
        <span>{description}</span>
      </span>
    </div>
  );
};
