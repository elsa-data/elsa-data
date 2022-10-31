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
    <div className={classNames("group relative inline-block", applyCSS)}>
      {trigger}
      <span
        className="absolute hidden group-hover:flex flex items-center -left-5 -top-2 -translate-y-full px-2 py-1
          bg-gray-600/75 rounded-lg text-center text-white text-sm whitespace-nowrap"
      >
        {description}
      </span>
    </div>
  );
};
