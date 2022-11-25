import React, { useState } from "react";
import {
  DatasetLightType,
} from "@umccr/elsa-types";
import axios from "axios";
import { useQuery } from "react-query";
import classNames from "classnames";
import { BoxNoPad } from "../../../components/boxes";
import { BoxPaginator } from "../../../components/box-paginator";
import { fileSize } from "humanize-plus";
import {ErrorBoundary} from "../../../components/error-display";

type Props = {
  // the (max) number of items shown on any single page
  pageSize: number;
};

export const DatasetsBox: React.FC<Props> = ({ pageSize }) => {
  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);

  // very briefly whilst the first page is downloaded we estimate that we have only one entry
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const dataQuery = useQuery(
    ["datasets", currentPage],
    async () => {
      const urlParams = new URLSearchParams();
      urlParams.append("page", currentPage.toString());
      const u = `/api/datasets?${urlParams.toString()}`;
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
      <div className="flex flex-col">
        <BoxPaginator
          currentPage={currentPage}
          setPage={setCurrentPage}
          rowCount={currentTotal}
          rowsPerPage={pageSize}
          rowWord="datasets"
        />
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
              {dataQuery.data.map((row, _rowIndex) => {
                return (
                  <tr key={row.id} className="border-b">
                    <td
                      className={classNames(
                        baseColumnClasses,
                        "w-100",
                        "font-mono",
                        "pl-4",
                        "text-left",
                        "whitespace-nowrap"
                      )}
                    >
                      {row.uri}
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
                      totalling {fileSize(row.summaryArtifactSizeBytes)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {dataQuery.isError && <ErrorBoundary error={dataQuery.error}></ErrorBoundary>}
      </div>
    </BoxNoPad>
  );
};
