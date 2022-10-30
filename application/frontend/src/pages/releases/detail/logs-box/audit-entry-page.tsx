import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import axios from "axios";
import { AuditEntryFullType } from "@umccr/elsa-types/schemas-audit";
import { LayoutBase } from "../../../../layouts/layout-base";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { ErrorDisplay } from "../../../../components/error-display";
import { BoxNoPad } from "../../../../components/boxes";

/**
 * The audit event page shows a full audit entry event as a JSON.
 */
export const AuditEntryPage = (): JSX.Element => {
  const { releaseId, objectId } = useParams<{
    releaseId: string;
    objectId: string;
  }>();

  const query = useQuery(
    ["audit-entry", objectId],
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
      <ErrorDisplay
        message={
          <div>
            Error: this component should not be rendered outside a route with a
            <code>releaseId</code> or <code>objectId</code> param
          </div>
        }
      />
    );
  }

  return (
    <LayoutBase>
      <BoxNoPad heading={`Audit event for ${objectId}`}>
        <div className="flex flex-row flex-wrap flex-grow mt-2">
          {query.isSuccess && <AuditEntryBox data={query.data ?? undefined} />}
        </div>
      </BoxNoPad>
    </LayoutBase>
  );
};

type AuditEntryBoxProps = {
  data?: AuditEntryFullType;
};

/**
 * Render the audit entry event.
 */
export const AuditEntryBox = ({ data }: AuditEntryBoxProps): JSX.Element => {
  return (
    <SyntaxHighlighter language="json" style={docco}>
      {JSON.stringify(data, null, 2)}
    </SyntaxHighlighter>
  );
};
