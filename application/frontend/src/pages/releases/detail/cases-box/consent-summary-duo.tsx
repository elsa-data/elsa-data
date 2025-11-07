import { useEffect, useState } from "react";
import { useEnvRelay } from "../../../../providers/env-relay-provider";
import type { ConsentStatementDuoType } from "../../../../../../backend/src/shared/schemas-releases";
import {
  resolveConsent,
  ResolvedDuo,
  ResolveDuoProse,
} from "./consent-common.tsx";

type Props = {
  statement: ConsentStatementDuoType;
};

function ConsentSummaryDuo({ statement }: Props) {
  const [duo, setDuo] = useState<ResolvedDuo | null>(null);
  const envRelay = useEnvRelay();
  const terminologyFhirUrl = envRelay.terminologyFhirUrl;

  useEffect(() => {
    const fetchData = async () => {
      const r = await resolveConsent(
        terminologyFhirUrl,
        statement.dataUseLimitation,
      );
      setDuo(r);
    };
    fetchData();
  }, [statement.dataUseLimitation]);

  if (duo == null) return <div></div>;

  return (
    <div className="text-left prose">
      <p>
        Static consent →
        <br />
        <ResolveDuoProse resolvedDuo={duo} />
      </p>
    </div>
  );
}

export default ConsentSummaryDuo;
