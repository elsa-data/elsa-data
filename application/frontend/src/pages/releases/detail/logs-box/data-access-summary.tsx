import React from "react";
import axios from "axios";
import { useQuery } from "react-query";
import { BoxNoPad } from "../../../../components/boxes";
import { Table } from "../../../../components/tables";
import {
  convertCamelCaseToTitle,
  getStringReadableBytes,
} from "../../../../helpers/utils";
import { formatLocalDateTime } from "../../../../helpers/datetime-helper";
import { AuditDataSummaryType } from "@umccr/elsa-types";
import { BiLinkExternal } from "react-icons/bi";
import {ErrorBoundary} from "../../../../components/error-boundary";

function DataAccessSummaryBox({ releaseId }: { releaseId: string }) {
  const dataAccessQuery = useQuery(
    ["release-data-access-audit", releaseId],
    async () =>
      await axios
        .get<AuditDataSummaryType[]>(
          `/api/releases/${releaseId}/audit-log/data-access/summary`
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
      <div>Data Access Log Summary</div>
      <a
        className="normal-case	bg-transparent flex cursor-pointer hover:bg-slate-200 p-1 rounded-md"
        href={`/releases/${releaseId}/audit-log/data-access`}
      >
        <BiLinkExternal />
      </a>
    </div>
  );

  return (
    <BoxNoPad heading={<BoxHeader />}>
      <Table
        tableHead={
          <tr className="text-sm text-gray-500 whitespace-nowrap border-b bg-slate-50 border-slate-700">
            {COLUMN_TO_SHOW.map((header) => (
              <th
                key={header}
                className="p-4 text-sm text-gray-600 whitespace-nowrap border-b hover:rounded-lg"
              >
                <div className="flex flex-nowrap space-x-1">
                  {convertCamelCaseToTitle(header)}
                </div>
              </th>
            ))}
          </tr>
        }
        tableBody={
          dataAccessQuery.isSuccess &&
          data &&
          data.map((row, idx) => (
            <>
              <tr
                key={idx}
                className="group text-sm text-gray-500 whitespace-nowrap border-b odd:bg-white even:bg-slate-50 border-slate-700 hover:bg-slate-100 hover:rounded-lg"
              >
                {COLUMN_TO_SHOW.map((column, idx) => (
                  <td
                    className="p-4 text-sm text-gray-500 whitespace-nowrap border-b"
                    key={idx}
                  >
                    {column === "dataAccessedInBytes" ||
                    column === "fileSize" ? (
                      getStringReadableBytes(row[column])
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
            </>
          ))
        }
      />
      {dataAccessQuery.isError && <ErrorBoundary error={dataAccessQuery.error}></ErrorBoundary>}
    </BoxNoPad>
  );
}

export default DataAccessSummaryBox;

/**
 * Helper Component
 */
function DisplayDownloadStatus({ status }: { status: string }) {
  let classNameStr = ``;

  if (status === "multiple-download") {
    classNameStr += "bg-amber-200	text-amber-500";
  } else if (status === "complete") {
    classNameStr += "bg-green-200	text-green-600";
  } else {
    classNameStr += "bg-neutral-200	text-neutral-500";
  }
  return (
    <div className={`${classNameStr} p-1 rounded-md w-fit font-semibold`}>
      {status}
    </div>
  );
}
