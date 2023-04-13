import React, { useState } from "react";
import { fileSize, oxford } from "humanize-plus";
import { isNil } from "lodash";
import { formatLocalDateTime } from "../../helpers/datetime-helper";
import { trpc } from "../../helpers/trpc";
import { usePageSizer } from "../../hooks/page-sizer";
import { BoxPaginator } from "../box-paginator";
import { EagerErrorBoundary } from "../errors";
import { IsLoadingDiv } from "../is-loading-div";
import classNames from "classnames";
import { useNavigate } from "react-router-dom";
import { ToolTip } from "../tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

const columnProps = [
  {
    columnTitle: "",
  },
  {
    columnTitle: "Description / URI",
  },
  {
    columnTitle: "Last Modified",
  },
  {
    columnTitle: "Artifacts",
  },
  {
    columnTitle: "",
  },
];

const baseColumnClasses = ["p-4", "font-medium", "text-gray-500"];
const baseMessageDivClasses =
  "min-h-[10em] w-full flex items-center justify-center";

export const DatasetTable: React.FC<{ includeDeletedFile: boolean }> = ({
  includeDeletedFile,
}) => {
  const navigate = useNavigate();

  // Pagination Variables
  const pageSize = usePageSizer();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const datasetQuery = trpc.datasetRouter.getDataset.useQuery(
    {
      page: currentPage,
      includeDeletedFile: includeDeletedFile,
    },
    {
      keepPreviousData: true,
      onSuccess: (res) => {
        setCurrentTotal(res.total);
      },
    }
  );

  if (datasetQuery.isLoading) return <IsLoadingDiv />;

  const data = datasetQuery.data?.data;
  if (isNil(data))
    return (
      <div className={classNames(baseMessageDivClasses)}>
        <p>There are no visible dataset(s)</p>
      </div>
    );

  return (
    <>
      <table className="table w-full table-auto">
        <thead>
          <tr>
            {columnProps.map((props, idx) => (
              <th key={idx}>{props.columnTitle}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => {
            return (
              <tr key={row.uri}>
                <td className={classNames(baseColumnClasses, "text-left")}>
                  {!row.isInConfig && (
                    <ToolTip
                      trigger={<FontAwesomeIcon icon={faTriangleExclamation} />}
                      description={`Missing dataset configuration`}
                    />
                  )}
                </td>
                <td className="whitespace-normal break-words">
                  <div className="font-bold"> {row.description}</div>
                  <div className="flex flex-row space-x-2 text-sm">
                    <p className="font-mono opacity-50">{row.uri}</p>
                  </div>
                </td>

                <td className={classNames(baseColumnClasses, "text-left")}>
                  {row.updatedDateTime
                    ? formatLocalDateTime(row.updatedDateTime as string)
                    : ""}
                </td>
                <td>
                  {row.summaryArtifactCount > 0 && (
                    <div>
                      <div>
                        {row.summaryArtifactCount}{" "}
                        {oxford(row.artifactTypesSummary.trim().split(" "))}
                        {" (s)"}
                      </div>
                      <div>
                        totalling{" "}
                        <span className="font-bold">
                          {fileSize(row.summaryArtifactSizeBytes)}
                        </span>
                      </div>
                    </div>
                  )}
                </td>
                <td className="text-right">
                  <button
                    className={classNames("btn-table-action-navigate")}
                    onClick={async () => {
                      navigate(row.uri);
                    }}
                  >
                    view
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {datasetQuery.isError && (
        <EagerErrorBoundary
          message={"Something went wrong fetching datasets."}
          error={datasetQuery.error}
          styling={"bg-red-100"}
        />
      )}
      <BoxPaginator
        currentPage={currentPage}
        setPage={setCurrentPage}
        rowCount={currentTotal}
        rowsPerPage={pageSize}
        rowWord="datasets"
      />
    </>
  );
};
