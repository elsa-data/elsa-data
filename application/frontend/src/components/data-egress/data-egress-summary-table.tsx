import React, { useState } from "react";
import { fileSize } from "humanize-plus";
import { isNil } from "lodash";
import { EagerErrorBoundary } from "../errors";
import { BoxPaginator } from "../box-paginator";
import { formatLocalDateTime } from "../../helpers/datetime-helper";
import { trpc } from "../../helpers/trpc";
import { usePageSizer } from "../../hooks/page-sizer";
import { Table } from "../tables";
import classNames from "classnames";
import { ToolTip } from "../tooltip";

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
    },
  );

  const data = dataEgressQuery.data?.data;
  if (isNil(data) && dataEgressQuery.isSuccess) return <>No Data Found!</>;

  return (
    <>
      <div className="mb-2	text-gray-500">
        A summary of data egress file events per file from the data storage
        server associated with this release.
      </div>

      {dataEgressQuery.isError && (
        <EagerErrorBoundary error={dataEgressQuery.error} />
      )}

      <Table
        tableHead={
          <tr>
            {COLUMN_TO_SHOW.map((header) => (
              <th className="!left-auto" key={header.key}>
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
                      <div className="font-mono">{row[objKey]}</div>
                    ) : objKey === "downloadStatus" ? (
                      <DisplayDownloadStatus
                        downloadedSize={row["totalDataEgressInBytes"]}
                        fileSize={row["fileSize"]}
                        isSuspended={!row.isActive}
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
        rowWord="Egress Summary Records"
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
  isSuspended,
}: {
  downloadedSize: number;
  fileSize: number;
  isSuspended: boolean;
}) {
  if (isSuspended) {
    return (
      <ToolTip
        trigger={
          <div className="badge badge-error whitespace-pre">{`suspended`}</div>
        }
        description={"File is no longer active for sharing"}
      />
    );
  } else if (downloadedSize > fileSize) {
    return (
      <div className="badge badge-warning whitespace-pre">{`multiple-download`}</div>
    );
  } else if (downloadedSize == fileSize) {
    return (
      <div className="badge badge-success whitespace-pre">{"complete"}</div>
    );
  }
  return <div className="badge badge-ghost whitespace-pre">{"incomplete"}</div>;
}
