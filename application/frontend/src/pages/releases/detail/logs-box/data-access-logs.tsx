import React, { useState } from "react";
import { AuditDataAccessType } from "@umccr/elsa-types";
import { useQuery } from "react-query";
import { Box } from "../../../../components/boxes";
import { ToolTip } from "../../../../components/tooltip";
import { formatLocalDateTime } from "../../../../helpers/datetime-helper";
import { categoryToDescription } from "../../../../components/audit-event/audit-event-table";
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
        `/api/releases/${releaseId}/audit-event/data-access`,
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
    { key: "whoId", value: "IP Address" },
    { key: "whoDisplayName", value: "Location" },
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
            accessType: "aws",
          })
        }
        className="button cursor-pointer"
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
        Sync (AWS)
      </button>
    </div>
  );
  const data: AuditDataAccessType[] | undefined = dataAccessQuery.data;
  if (isNil(data) && dataAccessQuery.isSuccess) return <>No Data Found!</>;
  return (
    <Box
      heading={<BoxHeader />}
      errorMessage={"Something went wrong fetching data access logs."}
    >
      <table className="table">
        <thead>
          {COLUMN_TO_SHOW.map((header, idx) => (
            <th key={`header-${idx}`}>{header.value}</th>
          ))}
        </thead>
        <tbody>
          {dataAccessQuery.isSuccess &&
            data &&
            data.map((row, rowIdx) => (
              <tr key={`body-row-${rowIdx}`}>
                {COLUMN_TO_SHOW.map((col, colIdx) => {
                  const objKey = col.key;
                  return (
                    <td key={`body-row-${rowIdx}-col-${colIdx}`}>
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
                      ) : objKey === "whoDisplayName" ||
                        objKey === "whoId" ||
                        objKey === "fileUrl" ? (
                        row[objKey]
                      ) : (
                        ""
                      )}
                    </td>
                  );
                })}
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
      <BoxPaginator
        currentPage={currentPage}
        setPage={(n) => setCurrentPage(n)}
        rowCount={currentTotal}
        rowsPerPage={pageSize}
        rowWord="dataAccess"
      />
    </Box>
  );
}

export default DataAccessLogsBox;
