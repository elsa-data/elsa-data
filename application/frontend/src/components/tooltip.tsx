import Popup from "reactjs-popup";
import React from "react";
import { PopupPosition } from "reactjs-popup/dist/types";

export type ToolTipProps = {
  trigger: JSX.Element;
  description: JSX.Element;
  position?: PopupPosition;
};

/**
 * Tooltip shown on hover and focus.
 */
export const ToolTip = ({
  trigger,
  description,
  position = "left top",
}: ToolTipProps): JSX.Element => {
  return (
    <Popup trigger={trigger} position={position} on={["hover", "focus"]}>
      {description}
    </Popup>
  );
};
