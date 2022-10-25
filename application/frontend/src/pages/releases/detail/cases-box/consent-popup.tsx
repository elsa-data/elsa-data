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
  CodingType,
  DuoLimitationCodedType,
  DuoModifierType,
  ReleaseCaseType,
  ReleasePatientType,
} from "@umccr/elsa-types";
import axios from "axios";
import { useQueryClient } from "react-query";
import classNames from "classnames";
import Popup from "reactjs-popup";
import { duoCodeToDescription, isKnownDuoCode } from "../../../../ontology/duo";
import {
  doLookup,
} from "../../../../helpers/ontology-helper";
import { useEnvRelay } from "../../../../providers/env-relay-provider";

type Props = {
  releaseId: string;
  nodeId: string;
};

type FlagsProps = {
  regions: string[];
};

type ResolvedDuo = {
  resolvedCode: string;
  resolvedDiseaseCode?: string;
  diseaseSystem?: string;
  modifiers: DuoModifierType[];
}

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

const resolveDuoCode = function(duoCode: string): string {
  const duoDescription = isKnownDuoCode(duoCode)
    ? duoCodeToDescription[duoCode]
    : null;

  return duoDescription ? `${duoCode} (${duoDescription})` : duoCode;
}

const resolveDiseaseCode = async function(
  terminologyFhirUrl: string,
  mondoSystem: string | undefined,
  mondoCode: string | undefined
): Promise<string | undefined> {
  if (mondoSystem === undefined) {
    return undefined;
  }
  if (mondoCode === undefined) {
    return undefined;
  }

  const oldCode = {system: mondoSystem, code: mondoCode};
  const newCode = await doLookup(terminologyFhirUrl, oldCode);

  const mondoDescription = newCode && newCode.display;

  return mondoDescription ? `${mondoCode} (${mondoDescription})` : mondoCode;
}

/**
 * The consent popup is a delayed effect popup that can show details of consent
 * for any node.
 *
 * @param releaseId
 * @param nodeId
 * @constructor
 */
export const ConsentPopup: React.FC<Props> = ({ releaseId, nodeId }) => {
  const [duos, setDuos] = useState<ResolvedDuo[]>([]);
  const envRelay = useEnvRelay();

  const terminologyFhirUrl = envRelay.terminologyFhirUrl;

  const u = `/api/releases/${releaseId}/consent/${nodeId}`;

  const onOpenHandler = async (ev: SyntheticEvent | undefined) => {
    const duos = await axios
        .get<DuoLimitationCodedType[]>(u)
        .then((response) => response.data);

    const resolvedDuos = await Promise.all(
      duos.map(async function(duo: DuoLimitationCodedType): Promise<ResolvedDuo> {
        const duoCode: string = (duo as any)?.code;

        const diseaseCode: string | undefined = (duo as any)?.diseaseCode;
        const diseaseSystem: string | undefined = (duo as any)?.diseaseSystem;

        const resolvedDuoCode: string = resolveDuoCode(duoCode);
        const resolvedDiseaseCode: string | undefined = await resolveDiseaseCode(
          terminologyFhirUrl,
          diseaseSystem,
          diseaseCode,
        );

        const modifiers: DuoModifierType[] = (duo as any)?.modifiers;

        return {
          resolvedCode: resolvedDuoCode,
          resolvedDiseaseCode: resolvedDiseaseCode,
          diseaseSystem: diseaseSystem,
          modifiers: modifiers,
        };
      })
    );

    setDuos(resolvedDuos);
  };

  return (
    <Popup
      trigger={<FontAwesomeIcon icon={faUnlock} />}
      position={["top center", "bottom right", "bottom left"]}
      on={["hover", "focus"]}
      onOpen={onOpenHandler}
    >
      <div className="p-2 space-y-4 bg-white text-sm border rounded drop-shadow-lg">
        {duos.map(function (resolvedDuo: ResolvedDuo) {
          return (
            <div>
              <div>
                <b>Code:</b>
                {" "}
                <span className="capitalize">{resolvedDuo.resolvedCode}</span>
              </div>
              {resolvedDuo.modifiers && (
                <div>
                  <b>Modifiers:</b>{" "}
                  <ul className="inline-list comma-list">
                    {resolvedDuo.modifiers.map(function (modifier) {
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
              {resolvedDuo.resolvedDiseaseCode && (
                <div>
                  <b>Disease Code:</b>
                  {" "}
                  <span className="capitalize">{resolvedDuo.resolvedDiseaseCode}</span>
                </div>
              )}
              {resolvedDuo.diseaseSystem && (
                <div>
                  <b>Disease System:</b> {resolvedDuo.diseaseSystem}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Popup>
  );
};
