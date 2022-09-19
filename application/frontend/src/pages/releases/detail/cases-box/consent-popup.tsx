import React, { SyntheticEvent, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDna,
  faFemale,
  faMale,
  faQuestion,
  faLock,
  faUnlock,
} from "@fortawesome/free-solid-svg-icons";

import {
  DuoLimitationCodedType,
  ReleaseCaseType,
  ReleasePatientType,
} from "@umccr/elsa-types";
import axios from "axios";
import { useQueryClient } from "react-query";
import classNames from "classnames";
import Popup from "reactjs-popup";

type Props = {
  releaseId: string;
  nodeId: string;
};

/**
 * The consent popup is a delayed effect popup that can show details of consent
 * for any node.
 *
 * @param releaseId
 * @param nodeId
 * @constructor
 */
export const ConsentPopup: React.FC<Props> = ({ releaseId, nodeId }) => {
  const [duos, setDuos] = useState<DuoLimitationCodedType[]>([]);

  const u = `/api/releases/${releaseId}/consent/${nodeId}`;

  const onOpenHandler = async (ev: SyntheticEvent | undefined) => {
    setDuos(
      await axios
        .get<DuoLimitationCodedType[]>(u)
        .then((response) => response.data)
    );
  };

  return (
    <Popup
      trigger={<FontAwesomeIcon icon={faUnlock} />}
      position={["top center", "bottom right", "bottom left"]}
      on={["hover", "focus"]}
      onOpen={onOpenHandler}
    >
      <div className="flex flex-row divide-x divide-blue-500 bg-white text-xs border rounded drop-shadow-lg">
        {duos.map((duo) => (
          <pre>{JSON.stringify(duo, null, 1)}</pre>
        ))}
      </div>
    </Popup>
  );
};
