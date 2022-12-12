import React, { useState } from "react";
import { DatasetLightType } from "@umccr/elsa-types";
import axios from "axios";
import { useQuery } from "react-query";
import classNames from "classnames";
import { BoxNoPad } from "../../../components/boxes";
import { BoxPaginator } from "../../../components/box-paginator";
import { fileSize, oxford } from "humanize-plus";
import { useNavigate } from "react-router-dom";
import { ToolTip } from "../../../components/tooltip";
import { formatLocalDateTime } from "../../../helpers/datetime-helper";
import { EagerErrorBoundary } from "../../../components/errors";
import { handleTotalCountHeaders } from "../../../helpers/paging-helper";
import { IsLoadingDiv } from "../../../components/is-loading-div";

type Props = {
  // the (max) number of items shown on any single page
  pageSize: number;
};

const warningIcon = (
  <ToolTip
    trigger={
      <span className="inline-block whitespace-nowrap rounded-full p-1 text-center align-baseline text-xs font-bold leading-none text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-alert-triangle"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="#2c3e50"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 9v2m0 4v.01" />
          <path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" />
        </svg>
      </span>
    }
    description={`Missing dataset configuration`}
  />
);

const columnProps = [
  {
    columnTitle: "",
    className: ["w-5"],
  },
  {
    columnTitle: "Dataset URI",
  },
  {
    columnTitle: "Dataset Description",
    titleStyle: { minWidth: "200px" },
  },
  {
    columnTitle: "Last Modified",
    titleStyle: { minWidth: "200px" },
  },
  {
    columnTitle: "Artifact Count",
  },
  {
    columnTitle: "Artifact Types",
  },
  {
    columnTitle: "Total Size",
  },
];

export const DatasetsBox: React.FC<Props> = ({ pageSize }) => {
  const navigate = useNavigate();

  const [includeDeletedFile, setIncludeDeletedFile] = useState<boolean>(false);

  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);

  // very briefly whilst the first page is downloaded we estimate that we have only one entry
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const dataQuery = useQuery(
    ["datasets", currentPage, includeDeletedFile],
    async () => {
      const urlParams = new URLSearchParams();
      urlParams.append("page", currentPage.toString());
      urlParams.append("includeDeletedFile", includeDeletedFile.toString());
      const u = `/api/datasets/?${urlParams.toString()}`;

      return await axios.get<DatasetLightType[]>(u).then((response) => {
        handleTotalCountHeaders(response, setCurrentTotal);

        return response.data;
      });
    },
    { keepPreviousData: true }
  );

  const baseColumnClasses = ["p-4", "font-medium", "text-gray-500"];

  const baseMessageDivClasses =
    "min-h-[10em] w-full flex items-center justify-center";
  return (
    <BoxNoPad
      heading="Datasets"
      errorMessage={"Something went wrong fetching datasets."}
    >
      <div className="border-b bg-gray-50 p-5 text-right sm:px-6">
        <div className="flex justify-start">
          <div
            className="inline-flex cursor-pointer items-center"
            onClick={() => setIncludeDeletedFile((p) => !p)}
          >
            <input
              className="mr-2 h-3 w-3 cursor-pointer rounded-sm"
              type="checkbox"
              checked={includeDeletedFile}
            />
            <label className="flex text-gray-800">
              <ToolTip
                trigger={
                  <div className="flex cursor-pointer items-center text-xs">
                    Include deleted files
                  </div>
                }
                description={`If checked the summary will include deleted files.`}
              />
            </label>
          </div>
        </div>
      </div>
      <div className="flex flex-col overflow-auto">
        {dataQuery.isLoading && <IsLoadingDiv />}
        {dataQuery.data && dataQuery.data.length === 0 && (
          <div className={classNames(baseMessageDivClasses)}>
            <p>There are no visible dataset(s)</p>
          </div>
        )}
        {dataQuery.data && dataQuery.data.length === 0 && currentTotal > 0 && (
          <div className={classNames(baseMessageDivClasses)}>
            <p>
              No cases are being displayed due to the identifier filter you have
              selected
            </p>
          </div>
        )}
        {dataQuery.data && dataQuery.data.length > 0 && (
          <table className="w-full table-auto text-left text-sm text-gray-500">
            <tbody>
              {/* Column Title */}
              <tr>
                {columnProps.map((props) => (
                  <td
                    className={classNames(
                      baseColumnClasses,
                      "font-semibold",
                      "border-b",
                      props.className
                    )}
                    style={props.titleStyle}
                  >
                    {props.columnTitle}
                  </td>
                ))}
              </tr>

              {dataQuery.data.map((row, rowIndex) => {
                return (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b hover:bg-gray-50"
                    onClick={() => navigate(`${row.id}`)}
                  >
                    <td className={classNames(baseColumnClasses, "text-left")}>
                      {!row.isInConfig && warningIcon}
                    </td>
                    <td
                      className={classNames(
                        baseColumnClasses,
                        "w-100",
                        "font-mono",
                        "text-left",
                        "whitespace-nowrap",
                        "h-full"
                      )}
                    >
                      <div className={`inline-block w-full truncate`}>
                        {row.uri}
                      </div>
                    </td>
                    <td className={classNames(baseColumnClasses, "text-left")}>
                      {row.description}
                    </td>
                    <td className={classNames(baseColumnClasses, "text-left")}>
                      {row.updatedDateTime
                        ? formatLocalDateTime(row.updatedDateTime as string)
                        : ""}
                    </td>
                    <td
                      className={classNames(
                        baseColumnClasses,
                        "text-left",
                        "w-60"
                      )}
                    >
                      {row.summaryArtifactCount}
                    </td>
                    <td
                      className={classNames(
                        baseColumnClasses,
                        "text-left",
                        "w-60",
                        "pr-4"
                      )}
                    >
                      {oxford(row.summaryArtifactIncludes.split(" "))}
                    </td>
                    <td
                      className={classNames(
                        baseColumnClasses,
                        "text-left",
                        "w-60",
                        "pr-4"
                      )}
                    >
                      {fileSize(row.summaryArtifactSizeBytes)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {dataQuery.isError && (
          <EagerErrorBoundary
            message={"Something went wrong fetching datasets."}
            error={dataQuery.error}
            styling={"bg-red-100"}
          />
        )}
      </div>
      <BoxPaginator
        currentPage={currentPage}
        setPage={setCurrentPage}
        rowCount={currentTotal}
        rowsPerPage={pageSize}
        rowWord="datasets"
      />
    </BoxNoPad>
  );
};
