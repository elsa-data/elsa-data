import { useEffect, useState } from "react";
import type {
  DuoLimitationCodedType,
  DuoModifierType,
} from "../../../../../../backend/src/business/services/consent/duo/duo-types.ts";
import { duoCodeToDescription, isKnownDuoCode } from "../../../../ontology/duo";
import { useEnvRelay } from "../../../../providers/env-relay-provider";
import { doLookup } from "../../../../helpers/ontology-helper";
import { FlagsFragment } from "../../../../components/flags-fragment.tsx";
import type { ConsentStatementDuoType } from "../../../../../../backend/src/shared/schemas-releases";

type Props = {
  statement: ConsentStatementDuoType;
};

type ResolvedDuo = {
  resolvedCode: string;
  resolvedDiseaseCode?: string;
  diseaseSystem?: string;
  modifiers: DuoModifierType[];
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
  mondoCode: string | undefined,
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

function ConsentSummaryDuo({ statement }: Props) {
  const [duo, setDuo] = useState<ResolvedDuo | null>(null);
  const envRelay = useEnvRelay();

  const terminologyFhirUrl = envRelay.terminologyFhirUrl;

  useEffect(() => {
    const fetchConsent = async (d: DuoLimitationCodedType) => {
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

      setDuo({
        resolvedCode: resolvedDuoCode,
        resolvedDiseaseCode: resolvedDiseaseCode,
        diseaseSystem: diseaseSystem,
        modifiers: modifiers,
      });
    };

    fetchConsent(statement.dataUseLimitation);
  }, [statement.dataUseLimitation]);

  if (duo == null) return <div></div>;

  return (
    <div className="text-left prose">
      <p>
        <b>Code:</b> <span className="capitalize">{duo.resolvedCode}</span>
      </p>
      {duo.modifiers && (
        <p>
          <b>Modifiers:</b>{" "}
          <ul className="inline-list comma-list">
            {duo.modifiers.map(function (modifier, modIdx) {
              const regions: string[] = (modifier as any)?.regions;
              return (
                <li key={`duo-mod-${modIdx}`}>
                  {modifier.code}
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
        </p>
      )}
      {duo.resolvedDiseaseCode && (
        <p>
          <b>Disease Code:</b>{" "}
          <span className="capitalize">{duo.resolvedDiseaseCode}</span>
        </p>
      )}
      {duo.diseaseSystem && (
        <p>
          <b>Disease System:</b> {duo.diseaseSystem}
        </p>
      )}
    </div>
  );
}

export default ConsentSummaryDuo;
