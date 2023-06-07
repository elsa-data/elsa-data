import React, { useState } from "react";
import { fileSize } from "humanize-plus";
import { isNil } from "lodash";
import { EagerErrorBoundary } from "../errors";
import { BoxPaginator } from "../box-paginator";
import { formatLocalDateTime } from "../../helpers/datetime-helper";
import { trpc } from "../../helpers/trpc";
import { usePageSizer } from "../../hooks/page-sizer";
import { Table } from "../tables";

const COLUMN_TO_SHOW = [
  { key: "fileUrl", value: "File URL" },
  {
    key: "downloadStatus",
    value: (
      <span title="A comparison between data egress and file size.">
        {"Download Status"}
      </span>
    ),
  },
  { key: "totalDataEgressInBytes", value: "Total Egress Size" },
  { key: "fileSize", value: "File Size" },
  { key: "lastOccurredDateTime", value: "Last Accessed" },
];

export function DataEgressSummaryTable({ releaseKey }: { releaseKey: string }) {
  // Pagination Variables
  const pageSize = usePageSizer();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const dataEgressQuery = trpc.releaseDataEgress.dataEgressSummary.useQuery(
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
        A summary of events of every data egress from the data storage based on
        file associated with the release.
      </div>

      {dataEgressQuery.isError && (
        <EagerErrorBoundary
          error={dataEgressQuery.error}
        />
      )}

      <Table
        tableHead={
          <tr>
            {COLUMN_TO_SHOW.map((header) => (
              <th className="!left-auto normal-case" key={header.key}>
                {header.value}
              </th>
            ))}
          </tr>
        }
        tableBody={
          dataEgressQuery.isSuccess &&
          data &&
          data.map((row, rowIdx) => (
            <tr key={`body-row-${rowIdx}`}>
              {COLUMN_TO_SHOW.map((column, colIdx) => {
                const objKey = column.key;
                return (
                  <td key={`body-row-${rowIdx}-col-${colIdx}`}>
                    {objKey === "totalDataEgressInBytes" ||
                    objKey === "fileSize" ? (
                      fileSize(row[objKey])
                    ) : objKey === "lastOccurredDateTime" &&
                      row[objKey] != null ? (
                      formatLocalDateTime(row[objKey] as string)
                    ) : objKey === "fileUrl" ? (
                      row[objKey]
                    ) : objKey === "downloadStatus" ? (
                      <DisplayDownloadStatus
                        downloadedSize={row["totalDataEgressInBytes"]}
                        fileSize={row["fileSize"]}
                      />
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

/**
 * Helper Component
 */
function DisplayDownloadStatus({
  downloadedSize,
  fileSize,
}: {
  downloadedSize: number;
  fileSize: number;
}) {
  if (downloadedSize > fileSize) {
    return <div className="badge-warning badge">{`multiple-download`}</div>;
  } else if (downloadedSize == fileSize) {
    return <div className="badge-success badge">{"complete"}</div>;
  }
  return <div className="badge-ghost badge">{"incomplete"}</div>;
}
