import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileContract,
  faArrowRightToFile,
} from "@fortawesome/free-solid-svg-icons";

import ConsentSummaryDuo from "./consent-summary-duo.tsx";
import classNames from "classnames";
import type { ConsentStatementType } from "../../../../../../backend/src/shared/schemas-releases";
import ConsentSummaryCtrl from "./consent-summary-ctrl.tsx";

type Props = {
  statement: ConsentStatementType;

  // passed in in-case we need some more information from the backend
  releaseKey: string;
  nodeId: string;
};

/**
 * The consent popup displays consent content on hover over.
 *
 * @param props
 * @constructor
 */
export const ConsentPopup: React.FC<Props> = (props) => {
  const [isConsentHover, setIsConsentHover] = useState(false);

  return (
    <div
      className="dropdown-hover dropdown"
      onMouseOver={() => {
        setIsConsentHover(true);
      }}
      onMouseOut={() => {
        setIsConsentHover(false);
      }}
    >
      <label tabIndex={0}>
        {props.statement.type === "consent::ConsentStatementDynamicDuo" ? (
          <FontAwesomeIcon
            className={`cursor-pointer`}
            size={"xl"}
            icon={faArrowRightToFile}
          />
        ) : (
          <FontAwesomeIcon
            className={`cursor-pointer`}
            size={"xl"}
            icon={faFileContract}
          />
        )}
      </label>
      <ul
        tabIndex={-1}
        className={classNames(
          "dropdown-content block min-w-fit rounded border bg-white p-2 text-sm drop-shadow-lg",
          {
            hidden: !isConsentHover,
          },
        )}
      >
        {props.statement.type === "consent::ConsentStatementDynamicDuo" ? (
          <ConsentSummaryCtrl
            statement={props.statement}
            releaseKey={props.releaseKey}
            nodeId={props.nodeId}
          />
        ) : (
          <ConsentSummaryDuo statement={props.statement} />
        )}
      </ul>
    </div>
  );
};
