import React, { SyntheticEvent, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileContract } from "@fortawesome/free-solid-svg-icons";

import Popup from "reactjs-popup";
import ConsentSummary from "./consent-summary";

type Props = {
  releaseKey?: string;
  nodeId?: string;
  consentId?: string;
};

/**
 * The consent popup is a delayed effect popup that can show details of consent
 * for any node.
 *
 * @param releaseKey
 * @param nodeId
 * @constructor
 */
export const ConsentPopup: React.FC<Props> = (props) => {
  return (
    <Popup
      trigger={
        <FontAwesomeIcon className={`cursor-pointer`} icon={faFileContract} />
      }
      position={["top center", "bottom right", "bottom left"]}
      on={["hover", "focus"]}
    >
      <div className="rounded border bg-white p-2 text-sm drop-shadow-lg">
        <ConsentSummary {...props} />
      </div>
    </Popup>
  );
};
