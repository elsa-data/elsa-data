import React, { ReactNode } from "react";
import { ReleaseCaseType } from "@umccr/elsa-types";
import axios from "axios";
import { useQuery, useQueryClient } from "react-query";
import { IndeterminateCheckbox } from "../../../../components/indeterminate-checkbox";
import classNames from "classnames";
import usePagination from "headless-pagination-react";
import { BoxNoPad } from "../../../../components/boxes";
import { BoxPaginator } from "../../../../components/box-paginator";

type Props = {
  releaseId: string;

  // a map of every dataset uri we will encounter mapped to a single letter
  datasetMap: Map<string, ReactNode>;

  // the total number of log entries that we will be scrolling/paging through
  logsCount: number;

  // the (max) number of log items shown on any single page
  pageSize: number;
};

export const LogsBox: React.FC<Props> = ({
  releaseId,
  datasetMap,
  logsCount,
  pageSize,
}) => {
  const queryClient = useQueryClient();

  const paginator = usePagination({
    totalItems: logsCount,
    perPage: pageSize,
    maxLinks: 5,
    initialPage: 1,
  });

  const dataQuery = useQuery(
    ["releases-cases", paginator.page, releaseId],
    async () => {
      return await axios
        .get<ReleaseCaseType[]>(
          `/api/releases/${releaseId}/cases?page=${paginator.page}`
        )
        .then((response) => response.data);
    },
    { keepPreviousData: true }
  );

  const rowSpans: number[] = [];

  // this horrible little piece of logic is used to make rowspans where we have a common
  // dataset shared by rows
  // our cases are always ordered by dataset - so that is why this will generally work
  if (dataQuery.isSuccess) {
    let currentDataset = "not a dataset";
    let currentSpanRow = -1;

    for (let r = 0; r < dataQuery.data.length; r++) {
      if (dataQuery.data[r].fromDatasetUri != currentDataset) {
        // if we have changed from the previous - then its a new span..
        currentSpanRow = r;
        currentDataset = dataQuery.data[r].fromDatasetUri;

        rowSpans.push(1);
      } else {
        // if its the same as the previous - we want to increase the 'current' and put in a marker to the rowspans
        rowSpans[currentSpanRow] += 1;
        rowSpans.push(-1);
      }
    }
  }

  const baseColumnClasses = "py-4 font-medium text-gray-900 whitespace-nowrap";

  return (
    <BoxNoPad heading="Audit Logs">
      <div className="flex flex-col">
        <BoxPaginator
          {...paginator}
          rowWord="log entries"
          rowCount={logsCount}
        />
        <table className="w-full text-sm text-left text-gray-500 table-fixed">
          <tbody>
            {dataQuery.data &&
              dataQuery.data.map((row, rowIndex) => {
                return (
                  <tr key={row.id} className="border-b">
                    <td
                      className={classNames(
                        baseColumnClasses,
                        "w-12",
                        "text-center"
                      )}
                    >
                      2022-01-23 12:23:45
                    </td>
                    <td
                      className={classNames(
                        baseColumnClasses,
                        "text-left",
                        "w-40"
                      )}
                    >
                      {row.externalId}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </BoxNoPad>
  );
};
