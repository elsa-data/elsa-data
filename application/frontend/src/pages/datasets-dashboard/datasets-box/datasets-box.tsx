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
import { Box } from "../../../components/boxes";
import { EagerErrorBoundary } from "../../../components/error-boundary";
import { handleTotalCountHeaders } from "../../../helpers/paging-helper";

type Props = {
  // the (max) number of items shown on any single page
  pageSize: number;
};

const warningIcon = (
  <ToolTip
    trigger={
      <span className="text-xs inline-block p-1 leading-none text-center whitespace-nowrap align-baseline font-bold text-white rounded-full">
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
    <BoxNoPad heading="Datasets" errorMessage={"Something went wrong fetching datasets."}>
      <div className="p-5 bg-gray-50 text-right sm:px-6 border-b">
        <div className="flex justify-start">
          <div
            className="inline-flex cursor-pointer items-center"
            onClick={() => setIncludeDeletedFile((p) => !p)}
          >
            <input
              className="h-3 w-3 rounded-sm mr-2 cursor-pointer"
              type="checkbox"
              checked={includeDeletedFile}
            />
            <label className="flex text-gray-800">
              <ToolTip
                trigger={
                  <div className="flex items-center text-xs cursor-pointer">
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
        {dataQuery.isLoading && (
          <div className={classNames(baseMessageDivClasses)}>Loading...</div>
        )}
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
          <table className="w-full text-sm text-left text-gray-500 table-auto">
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
                    className="border-b cursor-pointer hover:bg-gray-50"
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
                      <div className={`inline-block truncate w-full`}>
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
