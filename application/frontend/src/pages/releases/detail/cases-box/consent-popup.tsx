import React, { SyntheticEvent, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileContract } from "@fortawesome/free-solid-svg-icons";

import ConsentSummary from "./consent-summary";
import { ToolTip } from "../../../../components/tooltip";

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
  const [isConsentHover, setIsConsentHover] = useState(false);
  console.log("isConsentHover", isConsentHover);

  return (
    <div className="dropdown-hover dropdown">
      <label
        tabIndex={0}
        onMouseOver={() => {
          setIsConsentHover(true);
        }}
        onMouseOut={() => {
          setIsConsentHover(false);
        }}
      >
        <FontAwesomeIcon className={`cursor-pointer`} icon={faFileContract} />
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content !fixed min-w-fit rounded border bg-white p-2 text-sm drop-shadow-lg"
      >
        {isConsentHover && <ConsentSummary {...props} />}
      </ul>
    </div>
  );
};
