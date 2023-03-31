import React, { useState } from "react";
import { Box } from "../../../components/boxes";
import { formatLocalDateTime } from "../../../helpers/datetime-helper";
import { BiLinkExternal } from "react-icons/bi";
import { EagerErrorBoundary } from "../../../components/errors";
import { fileSize } from "humanize-plus";
import { trpc } from "../../../helpers/trpc";
import { isNil } from "lodash";
import { BoxPaginator } from "../../../components/box-paginator";
import { usePageSizer } from "../../../hooks/page-sizer";

const COLUMN_TO_SHOW = [
  { key: "fileUrl", value: "File URL" },
  { key: "fileSize", value: "File Size" },
  { key: "totalDataEgressInBytes", value: "Number of Bytes Accessed" },
  { key: "lastOccurredDateTime", value: "Last Occurred Access Date Time" },
];

export const DataAccessSummaryBox = ({
  releaseKey,
}: {
  releaseKey: string;
}) => {
  // Pagination Variables
  const pageSize = usePageSizer();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const dataAccessQuery = trpc.releaseDataAccessed.dataAccessedSummary.useQuery(
    { releaseKey, page: currentPage },
    {
      onSuccess: (res) => {
        setCurrentTotal(res.total);
      },
    }
  );

  const data = dataAccessQuery.data?.data;
  if (isNil(data) && dataAccessQuery.isSuccess) return <>No Data Found!</>;

  const BoxHeader = () => (
    <div className="flex justify-between">
      <div>Data Access Summary</div>
      <a
        className="flex	cursor-pointer rounded-md bg-transparent p-1 normal-case hover:bg-slate-200"
        href={`/releases/${releaseKey}/data-access-summary/records`}
      >
        <BiLinkExternal />
      </a>
    </div>
  );

  return (
    <Box heading={<BoxHeader />}>
      <div className="overflow-x-auto">
        <table className="w-ful table-compact table">
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
                        objKey === "fileSize"
                          ? fileSize(row[objKey])
                          : objKey === "lastOccurredDateTime" &&
                            row[objKey] != null
                          ? formatLocalDateTime(row[objKey] as string)
                          : objKey === "fileUrl"
                          ? row[objKey]
                          : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
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
