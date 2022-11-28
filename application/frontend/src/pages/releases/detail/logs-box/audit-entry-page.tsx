import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import axios from "axios";
import { AuditEntryFullType } from "@umccr/elsa-types/schemas-audit";
import { LayoutBase } from "../../../../layouts/layout-base";
import SyntaxHighlighter from "react-syntax-highlighter";
import { ErrorBoundary } from "../../../../components/error-boundary";
import { BoxNoPad } from "../../../../components/boxes";
import { arduinoLight } from "react-syntax-highlighter/dist/esm/styles/hljs";

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
      <ErrorBoundary
        message={
          <div>
            Error: this component should not be rendered outside a route with a
            <code>releaseId</code> or <code>objectId</code> param
          </div>
        }
        displayEagerly={true}
      />
    );
  }

  return (
    <LayoutBase>
      <BoxNoPad heading={`Audit event for ${objectId}`} errorMessage={"Something went wrong audit event."}>
        <div className="flex flex-row flex-wrap flex-grow mt-2 overflow-auto">
          {query.isSuccess && <AuditEntryBox data={query.data ?? undefined} />}
          {query.isError && <ErrorBoundary message={"Something went wrong fetching audit logs."} error={query.error}></ErrorBoundary>}
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
    // TODO convert this to a table format for more readability, add copy or download button.
    <SyntaxHighlighter
      language="json"
      style={arduinoLight}
      wrapLines={true}
      wrapLongLines={true}
    >
      {JSON.stringify(data, null, 2)}
    </SyntaxHighlighter>
  );
};
