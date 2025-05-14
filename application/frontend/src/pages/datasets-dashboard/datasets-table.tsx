import React, { useState } from "react";
import { isNil } from "lodash";
import { formatLocalDateTime } from "../../helpers/datetime-helper.ts";
import { usePageSizer } from "../../hooks/page-sizer.ts";
import { BoxPaginator } from "../../components/box-paginator.tsx";
import { EagerErrorBoundary } from "../../components/errors.tsx";
import { IsLoadingDiv } from "../../components/is-loading-div.tsx";
import classNames from "classnames";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { Table } from "../../components/tables.tsx";
import { useLoggedInUser } from "../../providers/logged-in-user-provider.tsx";
import { useTRPC } from "../../helpers/trpc-modern.ts";
import { useQuery } from "@tanstack/react-query";

const baseColumnClasses = ["p-4", "font-medium", "text-gray-500"];
const baseMessageDivClasses =
  "min-h-[10em] w-full flex items-center justify-center";

/**
 * A table listing the datasets available in the system
 *
 * @constructor
 */
export const DatasetsTable: React.FC = ({}) => {
  const trpc = useTRPC();
  const user = useLoggedInUser();
  const navigate = useNavigate();

  const allowDatasetView =
    user?.isAllowedRefreshDatasetIndex ||
    user?.isAllowedOverallAdministratorView;

  // Pagination Variables
  const pageSize = usePageSizer();
  const [currentPage, setCurrentPage] = useState<number>(1);

  const datasetQueryOptions = trpc.dataset.getAllDataset.queryOptions({
    page: currentPage,
  });
  const datasetQuery = useQuery(datasetQueryOptions);

  if (datasetQuery.isLoading) return <IsLoadingDiv />;

  const data = datasetQuery.data?.data;
  const total = datasetQuery.data?.total;

  if (isNil(data) || isNil(total))
    return (
      <div className={classNames(baseMessageDivClasses)}>
        <p>There are no visible dataset(s)</p>
      </div>
    );

  return (
    <>
      {datasetQuery.isError && (
        <EagerErrorBoundary error={datasetQuery.error} />
      )}

      <Table
        tableHead={
          <tr>
            {["", "Description / URI", "Count", "Last Modified"].map(
              (props, idx) => (
                <th key={idx}>{props}</th>
              ),
            )}

            {/* Placeholder for the VIEW button (defined below) */}
            {allowDatasetView && <th />}
          </tr>
        }
        tableBody={data.map((row) => {
          return (
            <tr key={row.uri}>
              {/* Is not in Config Icon */}
              <td className={classNames(baseColumnClasses, "text-left")}>
                {!row.isInConfig && (
                  <span title={`Missing dataset configuration`}>
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                  </span>
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
              <td className={classNames(baseColumnClasses, "text-left")}>
                <div className="flex flex-wrap">
                  <div className="inline-block whitespace-pre">
                    {`Cases (${row.totalCaseCount}), `}
                  </div>
                  <div className="inline-block whitespace-pre">
                    {`Patients (${row.totalPatientCount}), `}
                  </div>
                  <div className="inline-block whitespace-pre">
                    {`Specimens (${row.totalSpecimenCount})`}
                  </div>
                </div>
              </td>

              {/* Last Modified */}
              <td
                className={classNames(
                  baseColumnClasses,
                  "text-left",
                  "whitespace-nowrap",
                )}
              >
                {row.updatedDateTime
                  ? formatLocalDateTime(String(row.updatedDateTime))
                  : ""}
              </td>

              {/* VIEW (more details) button */}

              {allowDatasetView && (
                <td className="text-right">
                  <button
                    className={classNames("btn-table-action-navigate")}
                    onClick={async () => {
                      navigate(
                        encodeURIComponent(row.uri.replaceAll(".", "[dot]")),
                      );
                    }}
                  >
                    view
                  </button>
                </td>
              )}
            </tr>
          );
        })}
      />

      <BoxPaginator
        currentPage={currentPage}
        setPage={setCurrentPage}
        rowCount={total}
        rowsPerPage={pageSize}
        rowWord="datasets"
      />
    </>
  );
};
