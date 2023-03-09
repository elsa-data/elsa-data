import React, { useEffect, useState } from "react";
import axios from "axios";
import { DuoLimitationCodedType, DuoModifierType } from "@umccr/elsa-types";
import { hasFlag } from "country-flag-icons";
import getUnicodeFlagIcon from "country-flag-icons/unicode";
import { EagerErrorBoundary, ErrorState } from "../../../../components/errors";
import { duoCodeToDescription, isKnownDuoCode } from "../../../../ontology/duo";
import { useEnvRelay } from "../../../../providers/env-relay-provider";
import { doLookup } from "../../../../helpers/ontology-helper";

type Props = {
  releaseKey?: string;
  nodeId?: string;
  consentId?: string;
};

type FlagsProps = {
  regions: string[];
};

type ResolvedDuo = {
  resolvedCode: string;
  resolvedDiseaseCode?: string;
  diseaseSystem?: string;
  modifiers: DuoModifierType[];
};

const Flags: React.FC<FlagsProps> = ({ regions }) => {
  if (regions.length === 0) {
    return <></>;
  } else
    return (
      <>
        (
        <ul className="inline-list comma-list">
          {regions.map((region, idx) => (
            <li key={`region-${idx}`}>
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

const resolveDuoCode = function (duoCode: string): string {
  const duoDescription = isKnownDuoCode(duoCode)
    ? duoCodeToDescription[duoCode]
    : null;

  return duoDescription ? `${duoCode} (${duoDescription})` : duoCode;
};

const resolveDiseaseCode = async function (
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

  const oldCode = { system: mondoSystem, code: mondoCode };
  const newCode = await doLookup(terminologyFhirUrl, oldCode);

  const mondoDescription = newCode && newCode.display;

  return mondoDescription ? `${mondoCode} (${mondoDescription})` : mondoCode;
};

function ConsentSummary({ consentId, releaseKey, nodeId }: Props) {
  const [error, setError] = useState<ErrorState>({
    error: null,
    isSuccess: true,
  });
  const [duos, setDuos] = useState<ResolvedDuo[]>([]);
  const envRelay = useEnvRelay();

  const terminologyFhirUrl = envRelay.terminologyFhirUrl;

  // Url to fetch depending on what is given from props.
  let u = "";
  if (consentId) {
    u = `/api/datasets/consent/${consentId}`;
  } else {
    u = `/api/releases/${releaseKey}/consent/${nodeId}`;
  }

  useEffect(() => {
    const fetchConsent = async () => {
      const duos = await axios
        .get<DuoLimitationCodedType[]>(u)
        .then((response) => {
          setError({ error: null, isSuccess: true });
          return response.data;
        })
        .catch((error: any) => {
          setError({ error, isSuccess: false });
          return [];
        });

      const resolvedDuos = await Promise.all(
        duos.map(async function (
          duo: DuoLimitationCodedType
        ): Promise<ResolvedDuo> {
          const duoCode: string = (duo as any)?.code;

          const diseaseCode: string | undefined = (duo as any)?.diseaseCode;
          const diseaseSystem: string | undefined = (duo as any)?.diseaseSystem;

          const resolvedDuoCode: string = resolveDuoCode(duoCode);
          const resolvedDiseaseCode: string | undefined =
            await resolveDiseaseCode(
              terminologyFhirUrl,
              diseaseSystem,
              diseaseCode
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

    fetchConsent();
  }, [consentId, releaseKey, nodeId]);

  return (
    <div className="space-y-4">
      {error.isSuccess && (
        <>
          {duos.map(function (resolvedDuo: ResolvedDuo, duoIdx: number) {
            return (
              <div key={`duo-${duoIdx}`}>
                <div>
                  <b>Code:</b>{" "}
                  <span className="capitalize">{resolvedDuo.resolvedCode}</span>
                </div>
                {resolvedDuo.modifiers && (
                  <div>
                    <b>Modifiers:</b>{" "}
                    <ul className="inline-list comma-list">
                      {resolvedDuo.modifiers.map(function (modifier, modIdx) {
                        const regions: string[] = (modifier as any)?.regions;
                        return (
                          <li key={`duo-${duoIdx}-mod-${modIdx}`}>
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
                    <b>Disease Code:</b>{" "}
                    <span className="capitalize">
                      {resolvedDuo.resolvedDiseaseCode}
                    </span>
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
        </>
      )}
      {!error.isSuccess && (
        <EagerErrorBoundary
          message={"Something went wrong resolving duos."}
          error={error.error}
          styling={"bg-red-100"}
        />
      )}
    </div>
  );
}

export default ConsentSummary;
