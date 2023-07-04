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
    <div className={classNames("tooltip", applyCSS)} data-tip={description}>
      {trigger}
    </div>
  );
};
