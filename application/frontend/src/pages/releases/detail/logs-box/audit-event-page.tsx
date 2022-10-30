import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import axios from "axios";
import { AuditEntryType } from "@umccr/elsa-types";
import { AuditEntryFullType } from "@umccr/elsa-types/schemas-audit";
import { InformationBox } from "../information-box";
import { LayoutBase } from "../../../../layouts/layout-base";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

type AuditEventBoxProps = {
  data?: AuditEntryFullType;
};

export const AuditEventPage = (): JSX.Element => {
  const { releaseId, objectId } = useParams<{
    releaseId: string;
    objectId: string;
  }>();

  const query = useQuery(
    ["audit-event", objectId],
    async () => {
      return await axios
        .get<AuditEntryFullType | null>(
          `/api/releases/${releaseId}/audit-log/${objectId}`
        )
        .then((response) => response.data);
    },
    { keepPreviousData: true, enabled: !!objectId }
  );

  if (!releaseId || !objectId) {
    return (
      <h1>
        Error: this component should not be rendered outside a route with an{" "}
        <code>releaseId</code> or <code>objectId</code> param
      </h1>
    );
  }

  console.log("HERE");
  console.log(query);
  return (
    <LayoutBase>
      <div className="flex flex-row flex-wrap flex-grow mt-2">
        {query.isSuccess && <AuditEventBox data={query.data ?? undefined} />}
      </div>
    </LayoutBase>
  );
};

export const AuditEventBox = ({ data }: AuditEventBoxProps): JSX.Element => {
  return (
    <SyntaxHighlighter language="json" style={docco}>
      {JSON.stringify(data, null, 2)}
    </SyntaxHighlighter>
  );
};
