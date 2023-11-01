import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileContract } from "@fortawesome/free-solid-svg-icons";

import ConsentSummary from "./consent-summary";
import classNames from "classnames";

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
  const [isFetchConsent, setIsFetchConsent] = useState(false);

  return (
    <div
      className="dropdown-hover dropdown"
      onMouseOver={() => {
        setIsConsentHover(true);
        setIsFetchConsent(true);
      }}
      onMouseOut={() => {
        setIsConsentHover(false);
      }}
    >
      <label tabIndex={0}>
        <FontAwesomeIcon className={`cursor-pointer`} icon={faFileContract} />
      </label>
      <ul
        tabIndex={0}
        // className="dropdown-content min-w-fit rounded border bg-white p-2 text-sm drop-shadow-lg block"
        className={classNames(
          "dropdown-content block min-w-fit rounded border bg-white p-2 text-sm drop-shadow-lg",
          {
            hidden: !isConsentHover,
          },
        )}
      >
        {isFetchConsent && <ConsentSummary {...props} />}
      </ul>
    </div>
  );
};
