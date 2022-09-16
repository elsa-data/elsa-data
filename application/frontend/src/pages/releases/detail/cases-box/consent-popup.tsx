import getUnicodeFlagIcon from "country-flag-icons/unicode";
import { hasFlag } from "country-flag-icons";
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
import { duoCodeToDescription, isKnownDuoCode } from "../../../../ontology/duo";

type Props = {
  releaseId: string;
  nodeId: string;
};

type FlagsProps = {
  regions: string[];
};

const Flags: React.FC<FlagsProps> = ({ regions }) => {
  if (regions.length === 0) {
    return <></>;
  } else
    return (
      <>
        (
        <ul className="inline-list comma-list">
          {regions.map((region) => (
            <li>
              <span title={region}>
                {hasFlag(region) ? getUnicodeFlagIcon(region) : `(${region})`}
              </span>
            </li>
          ))}
        </ul>
        )
      </>
    );
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
      <div className="p-2 space-y-4 bg-white text-sm border rounded drop-shadow-lg">
        {duos.map(function (duo: DuoLimitationCodedType) {
          const diseaseCode = (duo as any)?.diseaseCode;
          const diseaseSystem = (duo as any)?.diseaseSystem;

          const description = isKnownDuoCode(diseaseCode)
            ? duoCodeToDescription[diseaseCode]
            : null;

          const resolvedDiseaseCode = description
            ? `${description} (${diseaseCode})`
            : diseaseCode;

          return (
            <div>
              <div>
                <b>Code:</b> {duo.code}
              </div>
              {duo.modifiers && (
                <div>
                  <b>Modifiers:</b>{" "}
                  <ul className="inline-list comma-list">
                    {duo.modifiers.map(function (modifier) {
                      const regions: string[] = (modifier as any)?.regions;
                      return (
                        <li>
                          {modifier.code}
                          {regions && (
                            <>
                              {" "}
                              <Flags regions={regions} />
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {resolvedDiseaseCode && (
                <div>
                  <b>Disease Code:</b> {resolvedDiseaseCode}
                </div>
              )}
              {diseaseSystem && (
                <div>
                  <b>Disease System:</b> {diseaseSystem}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Popup>
  );
};
