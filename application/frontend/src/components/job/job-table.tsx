import React, {
  Dispatch,
  Fragment,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { ReleasePreviousJobType } from "@umccr/elsa-types";
import { Box } from "../boxes";
import { BoxPaginator } from "../box-paginator";
import {
  ColumnSizingHeader,
  CoreHeader,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  Row,
  RowData,
  useReactTable,
} from "@tanstack/react-table";
import { Base7807Error, Base7807Response } from "@umccr/elsa-types";
import {
  formatFromNowTime,
  formatLocalDateTime,
} from "../../helpers/datetime-helper";
import { Table } from "../tables";
import { ToolTip } from "../tooltip";
import { BiChevronDown, BiChevronRight, BiChevronUp } from "react-icons/bi";
import classNames from "classnames";
import { EagerErrorBoundary, ErrorState } from "../errors";
import { IsLoadingDiv } from "../is-loading-div";
import { trpc } from "../../helpers/trpc";

declare module "@tanstack/table-core" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    headerStyling?: string;
    cellStyling?: string;
  }
}

/**
 * Props for job table.
 */
type JobTableProps = {
  /**
   * Maximum number of items to show in the table.
   */
  pageSize: number;

  /**
   * The type of job table to use.
   */
  releaseKey: string;
};

/**
 * The main job table component.
 */
export const JobTable = ({
  pageSize,
  releaseKey,
}: JobTableProps): JSX.Element => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTotal, setCurrentTotal] = useState(1);

  const [data, setData] = useState<ReleasePreviousJobType[]>([]);
  const [error, setError] = useState<ErrorState>({
    error: null,
    isSuccess: true,
  });

  const dataQuery = useJobQuery(
    currentPage,
    releaseKey,
    setCurrentTotal,
    setData,
    setError
  );

  useEffect(() => {
    dataQuery.refetch();
  }, []);

  const table = useReactTable({
    data: data,
    columns: createColumns(),
    getRowCanExpand: (row: Row<ReleasePreviousJobType> | undefined) => {
      if (row === undefined) return false;
      return row.getValue<string[]>("messages").length > 0;
    },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  if (dataQuery.isFetching) return <IsLoadingDiv />;

  return (
    <Box
      heading={
        <div className="flex grow items-center justify-between">
          <div>Previous Jobs</div>
        </div>
      }
    >
      <div className="flex flex-col">
        {error.isSuccess ? (
          <Table
            tableHead={table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={
                      header.id === "messages"
                        ? table.getToggleAllRowsExpandedHandler()
                        : () => {}
                    }
                    scope="col"
                    className={
                      !header.column.columnDef.meta?.headerStyling
                        ? "whitespace-nowrap"
                        : header.column.columnDef.meta?.headerStyling
                    }
                  >
                    {header.isPlaceholder ? undefined : (
                      <JobTableHeader header={header} />
                    )}
                  </th>
                ))}
              </tr>
            ))}
            tableBody={table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <tr
                  key={row.id}
                  onClick={() =>
                    row.getCanExpand() &&
                    row.getValue("messages") &&
                    row.toggleExpanded()
                  }
                >
                  {row.getVisibleCells().map((cell, i, row) => (
                    <td
                      key={cell.id}
                      className={classNames(
                        cell.column.columnDef.meta?.cellStyling,
                        {
                          "whitespace-nowrap":
                            !cell.column.columnDef.meta?.cellStyling,
                          "text-left": i + 1 !== row.length,
                        }
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
                {row.getIsExpanded() && row.getValue<string[]>("messages") && (
                  <tr key={`expanded-row.id`}>
                    {/* skip our expand/unexpand column */}
                    <td>&nbsp;</td>
                    {/* expanded content now into the rest of the columns */}
                    <td key={row.id} colSpan={row.getVisibleCells().length - 1}>
                      <div className="whitespace-pre-wrap font-mono text-xs">
                        {row.getValue<string[]>("messages").join("\n")}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          />
        ) : (
          <EagerErrorBoundary error={error.error} />
        )}
        <BoxPaginator
          currentPage={currentPage}
          setPage={(n) => {
            table.reset();
            setCurrentPage(n);
          }}
          rowCount={currentTotal}
          rowsPerPage={pageSize}
          rowWord="jobs"
        />
      </div>
    </Box>
  );
};

/**
 * Wrapper around a useQuery hook for an audit entry event.
 */
export const useJobQuery = (
  currentPage: number,
  releaseKey: string,
  setCurrentTotal: Dispatch<SetStateAction<number>>,
  setData: Dispatch<SetStateAction<ReleasePreviousJobType[]>>,
  setError: Dispatch<SetStateAction<ErrorState>>
) => {
  const query = {
    page: currentPage,
  };
  const options = {
    enabled: false,
    keepPreviousData: true,
    onSuccess: (data: any) => {
      setCurrentTotal(data.total);
      setData((data.data as ReleasePreviousJobType[]) ?? []);
      setError({ error: null, isSuccess: data.data !== undefined });
    },
    onError: (error: any) => {
      setData([]);
      setError({ error, isSuccess: false });
    },
  };

  return trpc.releaseJob.previousJobs.useQuery(
    { ...query, releaseKey },
    options
  );
};

const createdToolTipDescription = (created: any, started: any) => {
  const formattedCreated = formatLocalDateTime(String(created));
  const formattedStarted = formatLocalDateTime(String(started));

  if (formattedCreated === formattedStarted) {
    return formattedCreated;
  }

  return `Created: ${formattedCreated}, Started: ${formattedStarted}`;
};

export type JobTableHeaderProps<TData, TValue> = {
  header: CoreHeader<TData, TValue> & ColumnSizingHeader;
};

/**
 * Refactored code that goes in the main header components of the table.
 */
export const JobTableHeader = <TData, TValue>({
  header,
}: JobTableHeaderProps<TData, TValue>): JSX.Element => {
  return (
    <div
      onClick={header.column.getToggleSortingHandler()}
      className="flex flex-nowrap space-x-1"
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      {{
        asc: <BiChevronUp />,
        desc: <BiChevronDown />,
      }[header.column.getIsSorted() as string] ?? null}
    </div>
  );
};

export const CELL_BOX = "flex items-center justify-center";

export type ExpanderIndicatorProps = {
  isExpanded: boolean;
  symbolUnexpanded?: ReactNode;
  symbolExpanded?: ReactNode;
};

/**
 * An indicator for when a row is expanded.
 */
export const ExpandedIndicator = ({
  isExpanded,
  symbolUnexpanded,
  symbolExpanded,
}: ExpanderIndicatorProps): JSX.Element => {
  return (
    <div className={CELL_BOX}>
      {isExpanded ? symbolExpanded : symbolUnexpanded}
    </div>
  );
};

const TimeToolTip = ({ time }: { time: string | undefined }) => (
  <ToolTip
    trigger={formatFromNowTime(time)}
    description={formatLocalDateTime(time)}
  />
);

/**
 * Create the column definition based on the audit entry type.
 *
 * @param navigate a function for performing navigation
 */
export const createColumns = () => {
  const columnHelper = createColumnHelper<ReleasePreviousJobType>();
  return [
    columnHelper.accessor("messages", {
      header: ({ table }) => {
        return table.getCanSomeRowsExpand() &&
          table
            .getRowModel()
            .rows.map((row) => row.getValue<string[]>("messages"))
            .some((x) => x.length > 0) ? (
          <ToolTip
            trigger={
              <ExpandedIndicator
                isExpanded={table.getIsAllRowsExpanded()}
                symbolUnexpanded={<BiChevronRight />}
                symbolExpanded={<BiChevronDown />}
              ></ExpandedIndicator>
            }
            description={
              table.getIsAllRowsExpanded() ? "Contract All" : "Expand All"
            }
          />
        ) : null;
      },
      cell: (info) => {
        const isExpandedWithDetails =
          info.row.getCanExpand() && info.row.getValue("messages");
        return (
          <div className="flex justify-start">
            <ExpandedIndicator
              isExpanded={info.row.getIsExpanded()}
              symbolUnexpanded={
                isExpandedWithDetails ? <BiChevronRight /> : undefined
              }
              symbolExpanded={
                isExpandedWithDetails ? <BiChevronDown /> : undefined
              }
            />
          </div>
        );
      },
      enableSorting: false,
    }),
    columnHelper.accessor("type", {
      header: "Type",
      enableSorting: false,
    }),
    columnHelper.accessor("created", {
      header: "Created",
      cell: (info) => (
        <ToolTip
          trigger={formatFromNowTime(info.getValue<string | undefined>())}
          applyCSS="before:max-w-none"
          description={createdToolTipDescription(
            info.row.original.created,
            info.row.original.started
          )}
        />
      ),
      enableSorting: false,
    }),
    columnHelper.accessor("ended", {
      header: "Ended",
      cell: (info) => (
        <TimeToolTip time={info.getValue<string | undefined>()} />
      ),
      enableSorting: false,
    }),
    columnHelper.accessor("requestedCancellation", {
      header: "Requested Cancellation",
      cell: (info) =>
        info.row.getValue("requestedCancellation") ? "Yes" : "No",
      enableSorting: false,
    }),
  ];
};
