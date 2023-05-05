import React, { useState } from "react";
import { fileSize } from "humanize-plus";
import { isNil } from "lodash";
import { formatLocalDateTime } from "../../helpers/datetime-helper";
import { trpc } from "../../helpers/trpc";
import { usePageSizer } from "../../hooks/page-sizer";
import { BoxPaginator } from "../box-paginator";
import { EagerErrorBoundary } from "../errors";

const COLUMN_TO_SHOW = [
  { key: "fileUrl", value: "File URL" },
  { key: "egressBytes", value: "Egress Size" },
  { key: "description", value: "Description" },
  { key: "occurredDateTime", value: "Timestamp" },
  { key: "sourceIpAddress", value: "Source IP Address" },
  { key: "sourceLocation", value: "Estimate Location" },
  { key: "fileSize", value: "File Size" },
];

export function DataEgressDetailedTable({
  releaseKey,
}: {
  releaseKey: string;
}) {
  // Pagination Variables
  const pageSize = usePageSizer();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const dataEgressQuery = trpc.releaseDataEgress.dataEgressRecords.useQuery(
    { releaseKey, page: currentPage },
    {
      onSuccess: (res) => {
        setCurrentTotal(res.total);
      },
    }
  );

  const data = dataEgressQuery.data?.data;
  if (isNil(data) && dataEgressQuery.isSuccess) return <>No Data Found!</>;

  return (
    <>
      <div className="mb-2	text-gray-500">
        A detailed events on every events egress from data storage.
      </div>
      <table className="table-compact table w-full">
        <thead>
          <tr>
            {COLUMN_TO_SHOW.map((header) => (
              <th className="!left-auto normal-case" key={header.key}>
                {header.value}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataEgressQuery.isSuccess &&
            data &&
            data.map((row, rowIdx) => (
              <tr key={`body-row-${rowIdx}`}>
                {COLUMN_TO_SHOW.map((col, colIdx) => {
                  const objKey = col.key;
                  return (
                    <td key={`body-row-${rowIdx}-col-${colIdx}`}>
                      {objKey === "egressBytes" || objKey === "fileSize"
                        ? fileSize(row[objKey] ?? 0)
                        : objKey === "occurredDateTime"
                        ? formatLocalDateTime(row[objKey])
                        : objKey === "fileUrl" ||
                          objKey === "description" ||
                          objKey === "sourceIpAddress" ||
                          objKey === "sourceLocation"
                        ? row[objKey]
                        : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
        </tbody>
      </table>

      {dataEgressQuery.isError && (
        <EagerErrorBoundary
          message={"Something went wrong fetching data egress"}
          error={dataEgressQuery.error}
          styling={"bg-red-100"}
        />
      )}
      <BoxPaginator
        currentPage={currentPage}
        setPage={(n) => setCurrentPage(n)}
        rowCount={currentTotal}
        rowsPerPage={pageSize}
        rowWord="dataEgress"
      />
    </>
  );
}
