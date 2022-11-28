import React, { useState } from "react";
import { DatasetLightType } from "@umccr/elsa-types";
import axios from "axios";
import { useQuery } from "react-query";
import classNames from "classnames";
import { BoxNoPad } from "../../../components/boxes";
import { BoxPaginator } from "../../../components/box-paginator";
import { fileSize } from "humanize-plus";
import { useNavigate } from "react-router-dom";
import { ToolTip } from "../../../components/tooltip";

type Props = {
  // the (max) number of items shown on any single page
  pageSize: number;
};

const warningSuperscriptIcon = (
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

export const DatasetsBox: React.FC<Props> = ({ pageSize }) => {
  const navigate = useNavigate();

  const [onlyAvailDataset, setOnlyAvailDataset] = useState<boolean>(true);

  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);

  // very briefly whilst the first page is downloaded we estimate that we have only one entry
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const dataQuery = useQuery(
    ["datasets", currentPage, onlyAvailDataset],
    async () => {
      const urlParams = new URLSearchParams();
      urlParams.append("page", currentPage.toString());
      urlParams.append("includeDeletedFile", onlyAvailDataset.toString());
      const u = `/api/datasets/?${urlParams.toString()}`;

      return await axios.get<DatasetLightType[]>(u).then((response) => {
        const newTotal = parseInt(response.headers["elsa-total-count"]);

        if (isFinite(newTotal)) setCurrentTotal(newTotal);

        return response.data;
      });
    },
    { keepPreviousData: true }
  );

  const baseColumnClasses = ["py-4", "font-medium", "text-gray-500"];

  const baseMessageDivClasses =
    "min-h-[10em] w-full flex items-center justify-center";
  return (
    <BoxNoPad heading="Datasets">
      <div className="p-5 bg-gray-50 text-right sm:px-6 border-b">
        <div className="flex items-center justify-start">
          <input
            className="h-3 w-3 rounded-sm mr-2 cursor-pointer"
            type="checkbox"
            checked={onlyAvailDataset}
            onClick={() => setOnlyAvailDataset((p) => !p)}
          />
          <label className="flex text-gray-800">
            <ToolTip
              trigger={
                <div className="flex items-center text-xs">
                  Only datasets available
                </div>
              }
              description={`If unchecked the summary will include deleted files.`}
            />
          </label>
        </div>
      </div>
      <div className="flex flex-col">
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
          <table className="w-full text-sm text-left text-gray-500 table-fixed">
            <tbody>
              {dataQuery.data.map((row, rowIndex) => {
                return (
                  <tr
                    key={row.id}
                    className="border-b cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`${row.id}`)}
                  >
                    <td
                      className={classNames(
                        baseColumnClasses,
                        "w-100",
                        "font-mono",
                        "px-4",
                        "text-left",
                        "whitespace-nowrap",
                        "h-full"
                      )}
                    >
                      <div className="absolute">
                        {!row.isInConfig && warningSuperscriptIcon}
                      </div>
                      <div className={`pl-5 inline-block truncate w-full`}>
                        {row.uri}
                      </div>
                    </td>
                    <td className={classNames(baseColumnClasses, "text-left")}>
                      {row.description}
                    </td>
                    <td
                      className={classNames(
                        baseColumnClasses,
                        "text-left",
                        "w-60",
                        "pr-4"
                      )}
                    >
                      {row.summaryArtifactCount} artifacts of{" "}
                      {row.summaryArtifactIncludes.replaceAll(" ", "/")}{" "}
                      totalling {fileSize(row.summaryArtifactSizeBytes)} are
                      available
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
