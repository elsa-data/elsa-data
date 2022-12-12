import React, { useState } from "react";
import { AuditDataAccessType } from "@umccr/elsa-types";
import { useQuery } from "react-query";
import { BoxNoPad } from "../../../../components/boxes";
import { Table } from "../../../../components/tables";
import { ToolTip } from "../../../../components/tooltip";
import { formatLocalDateTime } from "../../../../helpers/datetime-helper";
import { categoryToDescription } from "./logs-box";
import { useParams } from "react-router-dom";
import axios from "axios";
import { isNil } from "lodash";
import { BoxPaginator } from "../../../../components/box-paginator";
import { usePageSizer } from "../../../../hooks/page-sizer";
import { fileSize } from "humanize-plus";
import { handleTotalCountHeaders } from "../../../../helpers/paging-helper";
import { EagerErrorBoundary } from "../../../../components/errors";

function DataAccessLogsBox() {
  const { releaseId, objectId } = useParams<{
    releaseId: string;
    objectId: string;
  }>();

  // Pagination Variables
  const pageSize = usePageSizer();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const dataAccessQuery = useQuery(
    ["release-data-access-audit", releaseId, objectId, currentPage],
    async () => {
      const response = await axios.get<AuditDataAccessType[]>(
        `/api/releases/${releaseId}/audit-log/data-access`,
        {
          params: {
            page: currentPage,
          },
        }
      );

      const data = response.data;
      handleTotalCountHeaders(response, setCurrentTotal);
      return data;
    }
  );

  const COLUMN_TO_SHOW = [
    { key: "fileUrl", value: "File URL" },
    { key: "whoDisplayName", value: "IP Address" },
    { key: "actionCategory", value: "Category" },
    { key: "occurredDateTime", value: "Occurred Date Time" },
    { key: "egressBytes", value: "Number of Bytes Accessed" },
  ];
  const BoxHeader = () => (
    <div className="flex items-center	justify-between">
      <div>Data Access Log Summary</div>
      <button
        onClick={async () =>
          await axios.post<any>(`/api/releases/${releaseId}/access-log/sync`, {
            accessType: "aws-presign",
          })
        }
        type="button"
        className="mr-2 inline-flex items-center rounded-lg bg-gray-400 px-3 py-2 text-center text-xs font-medium text-white shadow-gray-500 hover:bg-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-refresh mr-2 -ml-1 h-5 w-5"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="#ffffff"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
          <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
        </svg>
        Sync (Presigned URL access)
      </button>
    </div>
  );
  const data: AuditDataAccessType[] | undefined = dataAccessQuery.data;
  if (isNil(data) && dataAccessQuery.isSuccess) return <>No Data Found!</>;
  return (
    <BoxNoPad
      heading={<BoxHeader />}
      errorMessage={"Something went wrong fetching data access logs."}
    >
      <Table
        tableHead={
          <tr className="whitespace-nowrap border-b border-slate-700 bg-slate-50 text-sm text-gray-500">
            {COLUMN_TO_SHOW.map((header, idx) => (
              <th
                key={`header-${idx}`}
                className="whitespace-nowrap border-b p-4 text-sm text-gray-600 hover:rounded-lg"
              >
                <div className="flex flex-nowrap space-x-1">{header.value}</div>
              </th>
            ))}
          </tr>
        }
        tableBody={
          dataAccessQuery.isSuccess &&
          data &&
          data.map((row, rowIdx) => (
            <tr
              key={`body-row-${rowIdx}`}
              className="group whitespace-nowrap border-b border-slate-700 text-sm text-gray-500 odd:bg-white even:bg-slate-50 hover:rounded-lg hover:bg-slate-100"
            >
              {COLUMN_TO_SHOW.map((col, colIdx) => {
                const objKey = col.key;
                return (
                  <td
                    className="whitespace-nowrap border-b p-4 text-sm text-gray-500"
                    key={`body-row-${rowIdx}-col-${colIdx}`}
                  >
                    {objKey === "egressBytes" ? (
                      fileSize(row[objKey])
                    ) : objKey === "occurredDateTime" ? (
                      formatLocalDateTime(row[objKey])
                    ) : objKey === "actionCategory" ? (
                      <ToolTip
                        trigger={
                          <div className="flex h-8 w-8 items-center">
                            {row[objKey]}
                          </div>
                        }
                        description={categoryToDescription(row[objKey])}
                      />
                    ) : objKey === "whoDisplayName" || objKey === "fileUrl" ? (
                      row[objKey]
                    ) : (
                      ""
                    )}
                  </td>
                );
              })}
            </tr>
          ))
        }
      />
      {dataAccessQuery.isError && (
        <EagerErrorBoundary
          message={"Something went wrong fetching audit logs."}
          error={dataAccessQuery.error}
          styling={"bg-red-100"}
        />
      )}
      <BoxPaginator
        currentPage={currentPage}
        setPage={(n) => setCurrentPage(n)}
        rowCount={currentTotal}
        rowsPerPage={pageSize}
        rowWord="dataAccess"
      />
    </BoxNoPad>
  );
}

export default DataAccessLogsBox;
