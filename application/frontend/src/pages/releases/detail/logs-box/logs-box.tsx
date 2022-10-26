import React, { useState } from "react";
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
  useReactTable,
} from "@tanstack/react-table";

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
  data: AuditEntryType[];
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

  // console.log(dataQuery.data);

  // const detailsQuery = useQuery(
  //   ["releases-audit-log-details", currentPage, releaseId],
  //   async () => {
  //     return await axios.get<AuditEntryType[]>(
  //       `/api/releases/${releaseId}/audit-log/details?id=${dataQuery.data?.[0].objectId}&start=0&end=${MAXIMUM_DETAIL_LENGTH}`
  //     ).then(response => response.data);
  //   },
  //   { keepPreviousData: true }
  // );
  //
  // console.log(detailsQuery.data);

  const table = useReactTable({
    data: dataQuery.data ?? [],
    columns: createColumns(),
    getCoreRowModel: getCoreRowModel(),
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
              ))}
          </tbody>
        </table>
        <BoxPaginator
          currentPage={currentPage}
          setPage={(n) => setCurrentPage(n)}
          rowCount={currentTotal}
          rowsPerPage={pageSize}
          rowWord="log entries"
        />
      </div>
    </BoxNoPad>
  );
};

export const createColumns = () => {
  const columnHelper = createColumnHelper<AuditEntryType>();
  return [
    columnHelper.accessor("occurredDateTime", {
      header: "Time",
    }),
    columnHelper.accessor("occurredDuration", {
      header: "Duration",
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
  ];
};

export const createRows = ({ data }: RowProps): JSX.Element[] => {
  const baseColumnClasses =
    "py-2 font-small text-gray-400 whitespace-nowrap w-40 text-left pl-4";
  let viewLastDay = "";

  if (!data) return [];
  return data.map((row, rowIndex) => {
    const when = parseISO(row.occurredDateTime as string);

    // TODO: get timezone from somewhere in config

    const localDay = format(when, "d/M/yyyy", {
      timeZone: "Australia/Melbourne",
    });
    const localTime = format(when, "HH:mm:ss", {
      timeZone: "Australia/Melbourne",
    });

    let showDay = false;

    if (localDay !== viewLastDay) {
      showDay = true;
      viewLastDay = localDay;
    }

    let showDuration = false;
    let localDuration = "";

    if (row.occurredDuration) {
      const parsedDuration = duration.parse(row.occurredDuration);

      if (
        parsedDuration.days > 0 ||
        parsedDuration.weeks > 0 ||
        parsedDuration.months > 0 ||
        parsedDuration.years
      )
        // not at all expecting this to happen - if so - just show the entire duration string
        localDuration = `for ${row.occurredDuration}`;
      else if (parsedDuration.hours > 0)
        // even hr long activities are unlikely - but we can show that
        localDuration = `for ${parsedDuration.hours} hr(s)`;
      else if (parsedDuration.minutes > 0)
        localDuration = `for ${parsedDuration.minutes} min(s)`;
      else if (parsedDuration.seconds > 0)
        localDuration = `for ${parsedDuration.seconds} sec(s)`;
      else localDuration = "";

      showDuration = true;
    }

    return (
      <tr key={rowIndex} className="border-b pl-2 pr-2">
        <td
          className={classNames(baseColumnClasses, "w-40", "text-left", "pl-4")}
        >
          {showDay && <p className="font-bold">{viewLastDay}</p>}
          <p>{localTime}</p>
          {showDuration && <p className="text-xs">{localDuration}</p>}
        </td>
        <td className={classNames(baseColumnClasses, "text-left", "w-auto")}>
          {row.actionDescription}
        </td>
        <td
          className={classNames(
            baseColumnClasses,
            "text-right",
            "w-40",
            "pr-4"
          )}
        >
          {row.whoDisplayName}
        </td>
      </tr>
    );
  });
};
