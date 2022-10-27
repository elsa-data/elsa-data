import React, { useState, Fragment } from "react";
import { AuditEntryType } from "@umccr/elsa-types";
import axios from "axios";
import { useQuery } from "react-query";
import classNames from "classnames";
import { BoxNoPad } from "../../../../components/boxes";
import { BoxPaginator } from "../../../../components/box-paginator";
import { format } from "date-fns-tz";
import * as duration from "duration-fns";
import { parseISO } from "date-fns";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  Row,
  useReactTable,
} from "@tanstack/react-table";
import {
  formatDuration,
  formatTime,
} from "../../../../helpers/datetime-helper";
import { AuditEntryDetailsType } from "@umccr/elsa-types/schemas-audit";

/**
 * Maximum character length of details rendered in log box.
 */
export const MAXIMUM_DETAIL_LENGTH = 1000;

type LogsBoxProps = {
  releaseId: string;
  // the (max) number of log items shown on any single page
  pageSize: number;
};

type RowProps = {
  releaseId: string;
  data: AuditEntryType;
};

export const LogsBox = ({ releaseId, pageSize }: LogsBoxProps): JSX.Element => {
  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);

  // very briefly whilst the first page is downloaded we estimate that we have only one entry
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const dataQuery = useQuery(
    ["releases-audit-log", currentPage, releaseId],
    async () => {
      return await axios
        .get<AuditEntryType[]>(
          `/api/releases/${releaseId}/audit-log?page=${currentPage}`
        )
        .then((response) => {
          // as we page - the backend relays to us an accurate total count so we then use that
          // in the UI
          const newTotal = parseInt(response.headers["elsa-total-count"]);

          if (isFinite(newTotal)) setCurrentTotal(newTotal);

          return response.data;
        });
    },
    { keepPreviousData: true }
  );
  console.log(dataQuery.data);

  const table = useReactTable({
    data: dataQuery.data ?? [],
    columns: createColumns(),
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <BoxNoPad heading="Audit Logs">
      <div className="flex flex-col">
        <table className="w-full text-sm text-left text-gray-500 table-fixed">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b pl-2 pr-2">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="py-2 font-small text-gray-400 whitespace-nowrap w-40 text-left pl-4"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {dataQuery.isSuccess &&
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <tr key={row.id} className="border-b pl-2 pr-2">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="py-2 font-small text-gray-400 whitespace-nowrap w-40 text-left pl-4"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                  {row.getIsExpanded() && (
                    <tr>
                      {}
                      <td colSpan={row.getVisibleCells().length}>
                        <DetailsRow releaseId={releaseId} data={row.original} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
          </tbody>
        </table>
        <BoxPaginator
          currentPage={currentPage}
          setPage={(n) => {
            table.reset();
            setCurrentPage(n);
          }}
          rowCount={currentTotal}
          rowsPerPage={pageSize}
          rowWord="Log Entries"
        />
      </div>
    </BoxNoPad>
  );
};

const DetailsRow = ({ releaseId, data }: RowProps): JSX.Element => {
  const detailsQuery = useQuery(
    ["releases-audit-log-details", releaseId, data.objectId],
    async () => {
      return await axios
        .get<AuditEntryDetailsType | null>(
          `/api/releases/${releaseId}/audit-log/details?id=${data.objectId}&start=0&end=${MAXIMUM_DETAIL_LENGTH}`
        )
        .then((response) => response.data);
    },
    { keepPreviousData: true }
  );

  return (
    <div>
      {detailsQuery.isSuccess && (
        <code>
          {detailsQuery.data?.details ? detailsQuery.data.details + " ..." : ""}
        </code>
      )}
    </div>
  );
};

export const createColumns = () => {
  const columnHelper = createColumnHelper<AuditEntryType>();
  return [
    columnHelper.display({
      id: "expander",
      cell: ({ row }) => {
        return row.getCanExpand() ? (
          <button
            {...{
              onClick: row.getToggleExpandedHandler(),
              style: { cursor: "pointer" },
            }}
          >
            {row.getIsExpanded() ? "x" : "o"}
          </button>
        ) : (
          ""
        );
      },
    }),
    columnHelper.accessor("occurredDateTime", {
      header: "Time",
      cell: (info) => formatTime(info.getValue() as string | undefined),
    }),
    columnHelper.accessor("outcome", {
      header: "Outcome",
    }),
    columnHelper.accessor("actionCategory", {
      header: "Category",
    }),
    columnHelper.accessor("actionDescription", {
      header: "Description",
    }),
    columnHelper.accessor("whoDisplayName", {
      header: "Name",
    }),
    columnHelper.accessor("occurredDuration", {
      header: "Duration",
      cell: (info) => formatDuration(info.getValue()),
    }),
  ];
};
