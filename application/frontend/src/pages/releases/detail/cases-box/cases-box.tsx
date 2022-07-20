import React, { ReactNode } from "react";
import { ReleaseCaseType } from "@umccr/elsa-types";
import axios from "axios";
import { useQuery, useQueryClient } from "react-query";
import { IndeterminateCheckbox } from "../../../../components/indeterminate-checkbox";
import { PatientsFlexRow } from "./patients-flex-row";
import classNames from "classnames";
import usePagination from "headless-pagination-react";
import { BoxNoPad } from "../../../../components/boxes";
import { BoxPaginator } from "../../../../components/box-paginator";

type Props = {
  releaseId: string;

  // a map of every dataset uri we will encounter mapped to a single letter
  datasetMap: Map<string, ReactNode>;

  // the total number of cases that we will be scrolling/paging through
  casesCount: number;

  // the (max) number of case items shown on any single page
  pageSize: number;

  // whether the table is being viewed by someone with permissions to edit it
  isEditable: boolean;
};

export const CasesBox: React.FC<Props> = ({
  releaseId,
  datasetMap,
  casesCount,
  pageSize,
  isEditable,
}) => {
  const queryClient = useQueryClient();

  const paginator = usePagination({
    totalItems: casesCount,
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
    <BoxNoPad heading="Cases">
      <div className="flex flex-col">
        <BoxPaginator {...paginator} rowWord="cases" rowCount={casesCount} />
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
                      <IndeterminateCheckbox
                        disabled={true}
                        checked={row.nodeStatus === "selected"}
                        indeterminate={row.nodeStatus === "indeterminate"}
                      />
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
                    <td
                      className={classNames(
                        baseColumnClasses,
                        "text-left",
                        "pr-4"
                      )}
                    >
                      <PatientsFlexRow
                        releaseId={releaseId}
                        patients={row.patients}
                        showCheckboxes={isEditable}
                      />
                    </td>
                    {/* if we only have one dataset - then we don't show this column at all */}
                    {/* if this row is part of a rowspan then we also skip it (to make row spans work) */}
                    {datasetMap.size > 1 && rowSpans[rowIndex] >= 1 && (
                      <td
                        className={classNames(
                          baseColumnClasses,
                          "w-10",
                          "px-2",
                          "border-l",
                          "border-red-500"
                        )}
                        rowSpan={
                          rowSpans[rowIndex] == 1
                            ? undefined
                            : rowSpans[rowIndex]
                        }
                      >
                        {datasetMap.get(row.fromDatasetUri)}
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <div id="popup-root" />
    </BoxNoPad>
  );
};
