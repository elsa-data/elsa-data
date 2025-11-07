import type { ConsentStatementDynamicDuoType } from "../../../../../../backend/src/shared/schemas-releases";
import { useTRPC } from "../../../../helpers/trpc-modern.ts";
import { useQuery } from "@tanstack/react-query";
import { DuoLimitationCodedType } from "../../../../../../backend/src/business/services/consent/duo/duo-types.ts";
import { useEffect, useState } from "react";
import {
  resolveConsent,
  ResolvedDuo,
  ResolveDuoProse,
} from "./consent-common.tsx";
import { useEnvRelay } from "../../../../providers/env-relay-provider.tsx";

type Props = {
  statement: ConsentStatementDynamicDuoType;

  releaseKey: string;
  nodeId: string;
};

function ConsentSummaryCtrl({ statement, nodeId, releaseKey }: Props) {
  const trpc = useTRPC();
  const [duo, setDuo] = useState<ResolvedDuo | null>(null);
  const envRelay = useEnvRelay();
  const terminologyFhirUrl = envRelay.terminologyFhirUrl;

  const consentQueryOptions = trpc.release.getReleaseConsent.queryOptions({
    releaseKey: releaseKey ?? "",
    nodeId: nodeId ?? "",
  });
  const consentQuery = useQuery(consentQueryOptions);

  useEffect(() => {
    const fetchData = async (cons: DuoLimitationCodedType) => {
      const r = await resolveConsent(terminologyFhirUrl, cons);
      setDuo(r);
    };
    if (consentQuery.data && consentQuery.data.length > 0)
      fetchData(consentQuery.data[0]);
  }, [consentQuery.data]);

  return (
    <div className="space-y-4 prose">
      <p>
        Dynamic consent with identifier{" "}
        <code>{statement.consentSystemIdentifier}</code> →
        <br />
        {duo && <ResolveDuoProse resolvedDuo={duo} />}
        {!duo && <span>None</span>}
      </p>
    </div>
  );
}

export default ConsentSummaryCtrl;
