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
import { Table } from "../tables";

const columnHeaderArray = [
  "",
  "Description / URI",
  "Count",
  "Last Modified",
  "",
];

const baseColumnClasses = ["p-4", "font-medium", "text-gray-500"];
const baseMessageDivClasses =
  "min-h-[10em] w-full flex items-center justify-center";

export const DatasetTable: React.FC = ({}) => {
  const navigate = useNavigate();

  // Pagination Variables
  const pageSize = usePageSizer();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const datasetQuery = trpc.datasetRouter.getAllDataset.useQuery(
    {
      page: currentPage,
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
      <Table
        tableHead={
          <tr>
            {columnHeaderArray.map((props, idx) => (
              <th key={idx}>{props}</th>
            ))}
          </tr>
        }
        tableBody={data.map((row, rowIndex) => {
          return (
            <tr key={row.uri}>
              {/* Is not in Config Icon */}
              <td className={classNames(baseColumnClasses, "text-left")}>
                {!row.isInConfig && (
                  <ToolTip
                    trigger={<FontAwesomeIcon icon={faTriangleExclamation} />}
                    description={`Missing dataset configuration`}
                  />
                )}
              </td>

              {/* Dataset Description / URI */}
              <td className="whitespace-normal break-words">
                <div className="font-bold"> {row.description}</div>
                <div className="flex flex-row space-x-2 text-sm">
                  <p className="font-mono opacity-50">{row.uri}</p>
                </div>
              </td>

              {/* Count Cases/Patients/Specimen */}
              <td
                className={classNames(
                  baseColumnClasses,
                  "text-left",
                  "flex",
                  "flex-wrap"
                )}
              >
                <div className="inline-block whitespace-pre">
                  {`Cases (${row.totalCaseCount}), `}
                </div>
                <div className="inline-block whitespace-pre">
                  {`Patients (${row.totalPatientCount}), `}
                </div>
                <div className="inline-block whitespace-pre">
                  {`Specimens (${row.totalSpecimenCount})`}
                </div>
              </td>

              {/* Last Modified */}
              <td className={classNames(baseColumnClasses, "text-left")}>
                {row.updatedDateTime
                  ? formatLocalDateTime(String(row.updatedDateTime))
                  : ""}
              </td>

              {/* VIEW (more details) button */}
              <td className="text-right">
                <button
                  className={classNames("btn-table-action-navigate")}
                  onClick={async () => {
                    navigate(
                      encodeURIComponent(row.uri.replaceAll(".", "[dot]"))
                    );
                  }}
                >
                  view
                </button>
              </td>
            </tr>
          );
        })}
      />

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
