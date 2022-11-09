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
type Props = {
  releaseId: string;
};

function DataAccessLogsBox({ releaseId }: Props) {
  const dataAccessQuery = useQuery(
    ["release-data-access-audit", releaseId],
    async () =>
      await axios
        .get<AuditDataSummaryType[]>(
          `http://localhost:3000/api/releases/d7aac872-5f17-11ed-9cc3-b3710e4d5fa2/audit-log/data-access`
        )
        .then((response) => response.data)
  );

  // Move to types
  const COLUMN_TO_SHOW = [
    "target",
    "fileUrl",
    "fileSize",
    "dataAccessedInBytes",
    "downloadStatus",
    "lastAccessedTime",
  ] as const;

  const data: AuditDataSummaryType[] | undefined = dataAccessQuery.data;

  return (
    <BoxNoPad heading="Data Access Log Summary">
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
                    {column == "dataAccessedInBytes" || column == "fileSize" ? (
                      getStringReadableBytes(row[column])
                    ) : column == "downloadStatus" ? (
                      <DisplayDownloadStatus status={row[column]} />
                    ) : column == "lastAccessedTime" ? (
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
    </BoxNoPad>
  );
}

export default DataAccessLogsBox;

/**
 * Helper Component
 */
function DisplayDownloadStatus({ status }: { status: string }) {
  let classNameStr = ``;

  if (status == "multiple-download") {
    classNameStr += "bg-amber-200	text-amber-500";
  } else if (status == "complete") {
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
