import React, {
  Dispatch,
  Fragment,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { AuditEventType, RouteValidation } from "@umccr/elsa-types";
import axios from "axios";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Box } from "../boxes";
import { BoxPaginator } from "../box-paginator";
import {
  ColumnSizingHeader,
  CoreHeader,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  RowData,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  formatDuration,
  formatFromNowTime,
  formatLocalDateTime,
} from "../../helpers/datetime-helper";
import { ActionCategoryType } from "@umccr/elsa-types";
import { Table } from "../tables";
import { ToolTip } from "../tooltip";
import {
  BiChevronDown,
  BiChevronRight,
  BiChevronUp,
  BiLinkExternal,
} from "react-icons/bi";
import classNames from "classnames";
import { EagerErrorBoundary, ErrorState } from "../errors";
import { handleTotalCountHeaders } from "../../helpers/paging-helper";
import { DetailsRow } from "./details-row";
import AuditEventUserFilterType = RouteValidation.AuditEventUserFilterType;
import { FilterMenu } from "./filter-menu";
import { Link } from "react-router-dom";

declare module "@tanstack/table-core" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    headerStyling?: string;
    cellStyling?: string;
  }
}

/**
 * Props for audit event table.
 */
type AuditEventTableProps = {
  /**
   * The api path to use when displaying the audit entry table.
   */
  path?: string;
  /**
   * The id of the component in the path.
   */
  id?: string;
  /**
   * Maximum number of items to show in the table.
   */
  pageSize: number;

  /**
   * Whether to include the filter menu
   */
  filterMenu: boolean;
};

/**
 * The main audit event table component.
 */
export const AuditEventTable = ({
  path,
  id,
  pageSize,
  filterMenu,
}: AuditEventTableProps): JSX.Element => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTotal, setCurrentTotal] = useState(1);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [updateData, setUpdateData] = useState(true);

  const [data, setData] = useState([] as AuditEventType[]);
  const [error, setError] = useState<ErrorState>({
    error: null,
    isSuccess: true,
  });

  const [includeEvents, setIncludeEvents] = useState<
    AuditEventUserFilterType[]
  >(["release"]);

  const dataQueries = useAllAuditEventQueries(
    currentPage,
    path === undefined || id === undefined ? "" : `/${path}/${id}`,
    includeEvents,
    setCurrentTotal,
    setData,
    setError
  );

  useEffect(() => {
    if (updateData) {
      let key;
      if (sorting.length === 0) {
        key = "occurredDateTimeDesc";
      } else {
        const { id, desc } = sorting[0];
        key = desc ? id + "Desc" : id + "Asc";
      }

      if (key in dataQueries) {
        void dataQueries[key].refetch();
      }

      setUpdateData(false);
    }
  }, [updateData, dataQueries, sorting]);

  const table = useReactTable({
    data: data,
    columns: createColumns(),
    state: {
      sorting,
    },
    onSortingChange: (state) => {
      setSorting(state);
      setUpdateData(true);
    },
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualSorting: true,
  });

  // TODO Search and filtering functionality, refresh button, download audit log button, refresh loading wheel.
  return (
    <Box
      heading={
        <div className="flex items-center	justify-between">
          <div>Audit Logs</div>
          {filterMenu && (
            <div className="ml-2 flex content-center items-center">
              <FilterMenu
                includeEvents={includeEvents}
                setIncludeEvents={setIncludeEvents}
                setCurrentPage={setCurrentPage}
                setCurrentTotal={setCurrentTotal}
                setUpdateData={setUpdateData}
              />
            </div>
          )}
        </div>
      }
      errorMessage={"Something went wrong fetching audit logs."}
    >
      <div className="flex flex-col">
        {error.isSuccess ? (
          <Table
            tableHead={table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="whitespace-nowrap border-b border-slate-700 bg-slate-50 text-sm text-gray-500"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={
                      header.id === "objectId"
                        ? table.getToggleAllRowsExpandedHandler()
                        : () => {}
                    }
                    className={
                      !header.column.columnDef.meta?.headerStyling
                        ? "whitespace-nowrap border-b py-4 text-sm text-gray-600 hover:rounded-lg hover:bg-slate-100"
                        : header.column.columnDef.meta.headerStyling
                    }
                  >
                    {header.isPlaceholder ? undefined : (
                      <AuditEventTableHeader header={header} />
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
                    row.getValue("hasDetails") &&
                    row.toggleExpanded()
                  }
                  className="group whitespace-nowrap border-b border-slate-700 text-sm text-gray-500 odd:bg-white even:bg-slate-50 hover:rounded-lg hover:bg-slate-100"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={
                        !cell.column.columnDef.meta?.cellStyling
                          ? "whitespace-nowrap border-b py-4 text-sm text-gray-500"
                          : cell.column.columnDef.meta?.cellStyling
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
                {row.getIsExpanded() &&
                  (row.getValue("hasDetails") as boolean) && (
                    <tr
                      key={row.original.objectId}
                      className="border-b border-slate-700 text-sm text-gray-500 odd:bg-white even:bg-slate-50"
                    >
                      <td
                        key={row.original.objectId}
                        colSpan={row.getVisibleCells().length}
                        className="left border-b p-4 text-sm text-gray-500"
                      >
                        <DetailsRow objectId={row.original.objectId} />
                      </td>
                    </tr>
                  )}
              </Fragment>
            ))}
          />
        ) : (
          <EagerErrorBoundary
            message={"Could not display logs table."}
            error={error.error}
            styling={"bg-red-100"}
          />
        )}
        <BoxPaginator
          currentPage={currentPage}
          setPage={(n) => {
            table.reset();
            setUpdateData(true);
            setCurrentPage(n);
          }}
          rowCount={currentTotal}
          rowsPerPage={pageSize}
          rowWord="Log Entries"
        />
      </div>
    </Box>
  );
};

/**
 * Wrapper around a useQuery hook for an audit entry event.
 */
export const useAuditEventQuery = (
  currentPage: number,
  path: string,
  orderByProperty: string,
  orderAscending: boolean,
  includeEvents: AuditEventUserFilterType[],
  setCurrentTotal: Dispatch<SetStateAction<number>>,
  setData: Dispatch<SetStateAction<AuditEventType[]>>,
  setError: Dispatch<SetStateAction<ErrorState>>
) => {
  return useQuery(
    [
      `${path}-audit-event`,
      currentPage,
      orderByProperty,
      orderAscending,
      includeEvents,
    ],
    async () => {
      let filter = includeEvents
        .map((include) => `filter=${include}`)
        .join("&");
      if (filter !== "") {
        filter = `&${filter}`;
      }

      return await axios
        .get<AuditEventType[]>(
          `/api${path}/audit-event?page=${currentPage}&orderByProperty=${orderByProperty}&orderAscending=${orderAscending}${filter}`
        )
        .then((response) => {
          handleTotalCountHeaders(response, setCurrentTotal);

          return response.data;
        });
    },
    {
      keepPreviousData: true,
      enabled: false,
      onSuccess: (data) => {
        setData(data ?? []);
        setError({ error: null, isSuccess: data !== undefined });
      },
      onError: (error) => {
        setData([]);
        setError({ error, isSuccess: false });
      },
    }
  );
};

/**
 * Declares all audit entry queries used by the logs box.
 */
export const useAllAuditEventQueries = (
  currentPage: number,
  path: string,
  includeEvents: AuditEventUserFilterType[],
  setCurrentTotal: Dispatch<SetStateAction<number>>,
  setData: Dispatch<SetStateAction<AuditEventType[]>>,
  setError: Dispatch<SetStateAction<ErrorState>>
): { [key: string]: UseQueryResult<AuditEventType[]> } => {
  const useAuditEventQueryFn = (
    occurredDateTime: string,
    orderAscending: boolean
  ) => {
    return useAuditEventQuery(
      currentPage,
      path,
      occurredDateTime,
      orderAscending,
      includeEvents,
      setCurrentTotal,
      setData,
      setError
    );
  };

  return {
    occurredDateTimeAsc: useAuditEventQueryFn("occurredDateTime", true),
    occurredDateTimeDesc: useAuditEventQueryFn("occurredDateTime", false),
    outcomeAsc: useAuditEventQueryFn("outcome", true),
    outcomeDesc: useAuditEventQueryFn("outcome", false),
    actionCategoryAsc: useAuditEventQueryFn("actionCategory", true),
    actionCategoryDesc: useAuditEventQueryFn("actionCategory", false),
    actionDescriptionAsc: useAuditEventQueryFn("actionDescription", true),
    actionDescriptionDesc: useAuditEventQueryFn("actionDescription", false),
    whoDisplayNameAsc: useAuditEventQueryFn("whoDisplayName", true),
    whoDisplayNameDesc: useAuditEventQueryFn("whoDisplayName", false),
    occurredDurationAsc: useAuditEventQueryFn("occurredDuration", true),
    occurredDurationDesc: useAuditEventQueryFn("occurredDuration", false),
  };
};

export type AuditEventTableHeaderProps<TData, TValue> = {
  header: CoreHeader<TData, TValue> & ColumnSizingHeader;
};

/**
 * Refactored code that goes in the main header components of the table.
 */
export const AuditEventTableHeader = <TData, TValue>({
  header,
}: AuditEventTableHeaderProps<TData, TValue>): JSX.Element => {
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

/**
 * Convert an `ActionCategoryType` to a description.
 */
export const categoryToDescription = (category: ActionCategoryType): string => {
  if (category === "C") {
    return "Create";
  } else if (category === "R") {
    return "Read";
  } else if (category === "U") {
    return "Update";
  } else if (category === "D") {
    return "Delete";
  } else {
    return "Execute";
  }
};

/**
 * Convert a numerical outcome code to a description.
 */
export const outcomeToDescription = (outcome: number): string | undefined => {
  if (outcome === 0) {
    return "Success";
  } else if (outcome === 4) {
    return "Minor Failure";
  } else if (outcome === 8) {
    return "Serious Failure";
  } else if (outcome === 12) {
    return "Major Failure";
  } else {
    return undefined;
  }
};

/**
 * Check if an outcome is successful.
 */
export const outcomeIsSuccess = (outcome: number): boolean => {
  return outcome === 0;
};

export const CELL_BOX = "flex items-center justify-center w-8 h-8";

/**
 * Create the column definition based on the audit entry type.
 */
export const createColumns = () => {
  const columnHelper = createColumnHelper<AuditEventType>();
  return [
    columnHelper.accessor("objectId", {
      header: ({ table }) => {
        return table.getCanSomeRowsExpand() &&
          table
            .getRowModel()
            .rows.map((row) => row.getValue("hasDetails"))
            .some(Boolean) ? (
          <ToolTip
            trigger={
              <ExpandedIndicator
                isExpanded={table.getIsAllRowsExpanded()}
                symbolUnexpanded={<BiChevronRight />}
                symbolExpanded={<BiChevronDown />}
              ></ExpandedIndicator>
            }
            applyCSS={"flex-1 font-normal flex py-2"}
            description={
              table.getIsAllRowsExpanded() ? "Contract All" : "Expand All"
            }
          />
        ) : null;
      },
      cell: (info) => {
        const isExpandedWithDetails =
          info.row.getCanExpand() && info.row.getValue("hasDetails");
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
            <ToolTip
              trigger={
                <Link
                  to={`${info.getValue()}`}
                  className={classNames(
                    "invisible block hover:rounded-lg hover:bg-slate-200 group-hover:visible",
                    CELL_BOX
                  )}
                >
                  <BiLinkExternal />
                </Link>
              }
              description={"View Entry"}
            />
          </div>
        );
      },
      meta: {
        cellStyling: "text-sm text-gray-500 whitespace-nowrap border-b",
        headerStyling:
          "text-sm text-gray-600 whitespace-nowrap border-b hover:bg-slate-100 hover:rounded-lg",
      },
      enableSorting: false,
    }),
    columnHelper.accessor("hasDetails", {
      header: () => null,
      cell: () => null,
      enableSorting: false,
    }),
    columnHelper.accessor("occurredDateTime", {
      header: "Time",
      cell: (info) => {
        const dateTime = info.getValue() as string | undefined;
        return (
          <ToolTip
            trigger={formatFromNowTime(dateTime)}
            description={formatLocalDateTime(dateTime)}
          ></ToolTip>
        );
      },
      sortDescFirst: true,
    }),
    columnHelper.accessor("outcome", {
      header: "Outcome",
      cell: (info) => {
        const value = info.getValue();
        return (
          <ToolTip
            trigger={value}
            applyCSS={
              outcomeIsSuccess(value)
                ? classNames("rounded-lg bg-green-200", CELL_BOX)
                : classNames("rounded-lg bg-red-200", CELL_BOX)
            }
            description={outcomeToDescription(value)}
          ></ToolTip>
        );
      },
      meta: {
        cellStyling: "text-sm text-gray-500 whitespace-nowrap border-b",
      },
      sortDescFirst: true,
    }),
    columnHelper.accessor("actionCategory", {
      header: "Category",
      cell: (info) => {
        const value = info.getValue();
        return (
          <ToolTip
            trigger={<div className="flex h-8 w-8 items-center">{value}</div>}
            description={categoryToDescription(value)}
          ></ToolTip>
        );
      },
      meta: {
        cellStyling: "text-sm text-gray-500 whitespace-nowrap border-b",
      },
      sortDescFirst: true,
    }),
    columnHelper.accessor("actionDescription", {
      header: "Description",
      sortDescFirst: true,
    }),
    columnHelper.accessor("whoDisplayName", {
      header: "Name",
      sortDescFirst: true,
    }),
    columnHelper.accessor("occurredDuration", {
      header: "Duration",
      cell: (info) => formatDuration(info.getValue()),
      sortDescFirst: true,
    }),
  ];
};
