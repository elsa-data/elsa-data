import React, { useState } from "react";
import { fileSize } from "humanize-plus";
import { isNil } from "lodash";
import { faInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EagerErrorBoundary } from "../errors";
import { BoxPaginator } from "../box-paginator";
import { formatLocalDateTime } from "../../helpers/datetime-helper";
import { trpc } from "../../helpers/trpc";
import { usePageSizer } from "../../hooks/page-sizer";

const COLUMN_TO_SHOW = [
  { key: "fileUrl", value: "File URL" },
  {
    key: "downloadStatus",
    value: (
      <span title="A comparison between data egress and file size.">
        <button className="btn-xs btn-circle	btn mr-2 cursor-auto">
          <FontAwesomeIcon icon={faInfo} />
        </button>
        {"Download Status"}
      </span>
    ),
  },
  { key: "totalDataEgressInBytes", value: "Data Egressed Size" },
  { key: "fileSize", value: "File Size" },
  { key: "lastOccurredDateTime", value: "Last Accessed" },
];

export function DataEgressSummaryTable({ releaseKey }: { releaseKey: string }) {
  // Pagination Variables
  const pageSize = usePageSizer();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const dataAccessQuery = trpc.releaseDataEgress.dataEgressSummary.useQuery(
    { releaseKey, page: currentPage },
    {
      onSuccess: (res) => {
        setCurrentTotal(res.total);
      },
    }
  );

  const data = dataAccessQuery.data?.data;
  if (isNil(data) && dataAccessQuery.isSuccess) return <>No Data Found!</>;

  return (
    <>
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
          {dataAccessQuery.isSuccess &&
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
