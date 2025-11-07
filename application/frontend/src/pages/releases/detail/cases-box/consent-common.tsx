import {
  DuoLimitationCodedType,
  DuoModifierType,
} from "../../../../../../backend/src/business/services/consent/duo/duo-types.ts";
import { duoCodeToDescription, isKnownDuoCode } from "../../../../ontology/duo";
import { doLookup } from "../../../../helpers/ontology-helper";
import React from "react";
import { FlagsFragment } from "../../../../components/flags-fragment.tsx";
import { isEmpty } from "lodash";

export type ResolvedDuo = {
  resolvedCode: string;
  resolvedDiseaseCode?: string;
  diseaseSystem?: string;
  modifiers: DuoModifierType[];
};

/**
 * Takes an arbitrary DUO consent type and returns it resolved with
 * various terminology lookups.
 *
 * @param terminologyFhirUrl
 * @param d
 */
export async function resolveConsent(
  terminologyFhirUrl: string,
  d: DuoLimitationCodedType,
) {
  const duoCode: string = (d as any)?.code;
  const diseaseCode: string | undefined = (d as any)?.diseaseCode;
  const diseaseSystem: string | undefined = (d as any)?.diseaseSystem;

  const resolvedDuoCode: string = resolveDuoCode(duoCode);
  const resolvedDiseaseCode: string | undefined = await resolveDiseaseCode(
    terminologyFhirUrl,
    diseaseSystem,
    diseaseCode,
  );

  const modifiers: DuoModifierType[] = (d as any)?.modifiers;

  const resolved: ResolvedDuo = {
    resolvedCode: resolvedDuoCode,
    resolvedDiseaseCode: resolvedDiseaseCode,
    diseaseSystem: diseaseSystem,
    modifiers: modifiers,
  };

  return resolved;
}

/**
 * Function to render a string of a DUO code.
 *
 * @param duoCode
 */
export const resolveDuoCode = function (duoCode: string): string {
  const duoDescription = isKnownDuoCode(duoCode)
    ? duoCodeToDescription[duoCode]
    : null;

  // if we find it in our description map then display the description and code, otherwise
  // just display the code
  return duoDescription ? `${duoCode} (${duoDescription})` : duoCode;
};

/**
 * Async function to render a string with lookup of a code in a
 * terminology server.
 *
 * @param terminologyFhirUrl
 * @param system
 * @param code
 */
export const resolveDiseaseCode = async function (
  terminologyFhirUrl: string,
  system: string | undefined,
  code: string | undefined,
): Promise<string | undefined> {
  if (system === undefined) {
    return undefined;
  }
  if (code === undefined) {
    return undefined;
  }

  const oldCode = { system: system, code: code };
  const newCode = await doLookup(terminologyFhirUrl, oldCode);

  const description = newCode && newCode.display;

  return description ? `${code} (${description})` : code;
};

type Props = {
  resolvedDuo: ResolvedDuo;
};

/**
 * A snippet of prose that renders a DUO limitation statement
 * along with modifiers.
 *
 * @param resolvedDuo
 * @constructor
 */
export const ResolveDuoProse: React.FC<Props> = ({ resolvedDuo }) => {
  return (
    <>
      <b className="pl-2">Code:</b>{" "}
      <span className="capitalize">{resolvedDuo.resolvedCode}</span>
      <br />
      {!isEmpty(resolvedDuo.modifiers) && (
        <>
          <b className="pl-2">Modifiers:</b> <br />
          <ul className="pl-3 inline-list comma-list">
            {resolvedDuo.modifiers.map(function (modifier, modIdx) {
              // if we are a geographic modifier then we will have regions, otherwise not
              // we could clearly do better logic here - but it is just a demo to display these
              const regions: string[] = (modifier as any)?.regions;
              return (
                <li key={`duo-mod-${modIdx}`}>
                  {resolveDuoCode(modifier.code)}
                  {regions && (
                    <>
                      {" "}
                      <FlagsFragment regions={regions} />
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          <br />
        </>
      )}
      {resolvedDuo.resolvedDiseaseCode && (
        <>
          <b className="pl-2">Disease Code:</b>{" "}
          <span className="capitalize">{resolvedDuo.resolvedDiseaseCode}</span>
          <br />
        </>
      )}
      {resolvedDuo.diseaseSystem && (
        <>
          <b className="pl-2">Disease System:</b> {resolvedDuo.diseaseSystem}
          <br />
        </>
      )}
    </>
  );
};
