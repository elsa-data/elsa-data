import React from "react";
import axios from "axios";
import { useQuery } from "react-query";
import { Box } from "../../../components/boxes";
import { convertCamelCaseToTitle } from "../../../helpers/utils";
import { formatLocalDateTime } from "../../../helpers/datetime-helper";
import { AuditDataSummaryType } from "@umccr/elsa-types";
import { BiLinkExternal } from "react-icons/bi";
import { EagerErrorBoundary } from "../../../components/errors";
import { fileSize } from "humanize-plus";

export const DataAccessSummaryBox = ({
  releaseKey,
}: {
  releaseKey: string;
}) => {
  const dataAccessQuery = useQuery(
    ["release-data-access-audit", releaseKey],
    async () =>
      await axios
        .get<AuditDataSummaryType[]>(
          `/api/releases/${releaseKey}/audit-event/data-access/summary`
        )
        .then((response) => response.data)
  );

  const COLUMN_TO_SHOW = [
    "target",
    "fileUrl",
    "fileSize",
    "dataAccessedInBytes",
    "downloadStatus",
    "lastAccessedTime",
  ] as const;

  const data: AuditDataSummaryType[] | undefined = dataAccessQuery.data;

  const BoxHeader = () => (
    <div className="flex justify-between">
      <div>Data Access Summary</div>
      <a
        className="flex	cursor-pointer rounded-md bg-transparent p-1 normal-case hover:bg-slate-200"
        href={`/releases/${releaseKey}/audit-event/data-access`}
      >
        <BiLinkExternal />
      </a>
    </div>
  );

  return (
    <Box heading={<BoxHeader />}>
      <table className="table">
        <thead>
          <tr>
            {COLUMN_TO_SHOW.map((header) => (
              <th key={header}>{convertCamelCaseToTitle(header)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataAccessQuery.isSuccess &&
            data &&
            data.map((row, rowIdx) => (
              <tr key={`body-row-${rowIdx}`}>
                {COLUMN_TO_SHOW.map((column, colIdx) => (
                  <td key={`body-row-${rowIdx}-col-${colIdx}`}>
                    {column === "dataAccessedInBytes" ||
                    column === "fileSize" ? (
                      fileSize(row[column])
                    ) : column === "downloadStatus" ? (
                      <DisplayDownloadStatus status={row[column]} />
                    ) : column === "lastAccessedTime" ? (
                      formatLocalDateTime(row[column])
                    ) : (
                      row[column]
                    )}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
      {dataAccessQuery.isError && (
        <EagerErrorBoundary
          message={"Something went wrong fetching audit logs."}
          error={dataAccessQuery.error}
          styling={"bg-red-100"}
        />
      )}
    </Box>
  );
};

/**
 * Helper Component
 */
function DisplayDownloadStatus({ status }: { status: string }) {
  if (status === "multiple-download") {
    return <span className="badge-warning badge">{status}</span>;
  } else if (status === "complete") {
    return <span className="badge-success badge">{status}</span>;
  }

  return <span className="badge">{status}</span>;
}
