import React, {
  Dispatch,
  Fragment,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import {
  ActionCategoryType,
  AuditEventType,
  RouteValidation,
} from "@umccr/elsa-types";
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
import { Table } from "../tables";
import { ToolTip } from "../tooltip";
import { BiChevronDown, BiChevronRight, BiChevronUp } from "react-icons/bi";
import classNames from "classnames";
import { EagerErrorBoundary, ErrorState } from "../errors";
import { handleTotalCountHeaders } from "../../helpers/paging-helper";
import { DetailsRow } from "./details-row";
import { FilterElements } from "./filter-elements";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { IsLoadingDiv } from "../is-loading-div";
import AuditEventUserFilterType = RouteValidation.AuditEventUserFilterType;

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
  filterElements: boolean;

  /**
   * Initial state of selected items in filter
   */
  filterElementsInitial: AuditEventUserFilterType[];
};

/**
 * The main audit event table component.
 */
export const AuditEventTable = ({
  path,
  id,
  pageSize,
  filterElements,
  filterElementsInitial,
}: AuditEventTableProps): JSX.Element => {
  const navigate = useNavigate();

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
  >(filterElementsInitial);

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
    columns: createColumns(navigate),
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

  if (dataQueries.isFetching) return <IsLoadingDiv />;

  // TODO Search and filtering functionality, refresh button, download audit log button
  return (
    <Box
      heading={
        <div className="flex grow items-center justify-between">
          <div>Audit Events</div>
        </div>
      }
      errorMessage={"Something went wrong fetching audit events"}
    >
      <>
        <div className="flex grow justify-end">
          {filterElements && (
            <div className="ml-2 flex content-center items-center">
              <FilterElements
                includeEvents={includeEvents}
                setIncludeEvents={setIncludeEvents}
                setCurrentPage={setCurrentPage}
                setCurrentTotal={setCurrentTotal}
                setUpdateData={setUpdateData}
              />
            </div>
          )}
        </div>
        <div className="flex flex-col">
          {error.isSuccess ? (
            <Table
              tableHead={table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={
                        header.id === "hasDetails"
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
                  {row.getIsExpanded() &&
                    (row.getValue("hasDetails") as boolean) && (
                      <tr key={row.original.objectId}>
                        {/* skip our expand/unexpand column */}
                        <td>&nbsp;</td>
                        {/* expanded content now into the rest of the columns */}
                        <td
                          key={row.original.objectId}
                          colSpan={row.getVisibleCells().length - 1}
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
              message={"Could not display audit events table"}
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
            rowWord="audit events"
          />
        </div>
      </>
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
    return "create";
  } else if (category === "R") {
    return "read";
  } else if (category === "U") {
    return "update";
  } else if (category === "D") {
    return "delete";
  } else if (category === "E") {
    return "execute";
  } else {
    return "unknown";
  }
};

/**
 * Convert a numerical outcome code to a description.
 */
export const outcomeToDescription = (outcome: number): string | undefined => {
  if (outcome === 0) {
    return "success";
  } else if (outcome === 4) {
    return "minor failure";
  } else if (outcome === 8) {
    return "serious failure";
  } else if (outcome === 12) {
    return "major failure";
  } else {
    return undefined;
  }
};

export const CELL_BOX = "flex items-center justify-center";

/**
 * Create the column definition based on the audit entry type.
 *
 * @param navigate a function for performing navigation
 */
export const createColumns = (navigate: NavigateFunction) => {
  const columnHelper = createColumnHelper<AuditEventType>();
  return [
    columnHelper.accessor("hasDetails", {
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
          </div>
        );
      },
      enableSorting: false,
    }),
    columnHelper.accessor("occurredDateTime", {
      header: "Time",
      cell: (info) => {
        const dateTime = info.getValue() as string | undefined;
        if (info.row.original.occurredDuration) {
          return (
            <ToolTip
              trigger={
                <div>
                  <div className="break-all text-xs">
                    {formatFromNowTime(dateTime)}
                  </div>
                  <div className="break-all text-xs opacity-50">
                    {`(took ${formatDuration(
                      info.row.original.occurredDuration
                    )})`}
                  </div>
                </div>
              }
              description={formatLocalDateTime(dateTime)}
            ></ToolTip>
          );
        } else
          return (
            <ToolTip
              trigger={formatFromNowTime(dateTime)}
              description={formatLocalDateTime(dateTime)}
            ></ToolTip>
          );
      },
      sortDescFirst: true,
    }),
    columnHelper.accessor("actionCategory", {
      header: "Category",
      cell: (info) => {
        const value = info.getValue();
        return (
          <span
            className={classNames("badge", {
              "badge-primary": value === "C",
              "badge-info": value === "R",
              "badge-secondary": value === "E",
              "badge-warning": value === "U",
              "badge-error": value === "D",
            })}
          >
            {categoryToDescription(value)}
          </span>
        );
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
      cell: (info) => {
        return (
          <ToolTip
            trigger={info.getValue()}
            description={info.row.original.whoId}
          ></ToolTip>
        );
      },
    }),
    columnHelper.accessor("outcome", {
      header: "Outcome",
      cell: (info) => {
        const value = info.getValue();
        return (
          <span
            className={classNames("badge", {
              "badge-success": value < 4,
              "badge-warning": value >= 4 && value < 8,
              "badge-error": value >= 8,
            })}
          >
            {outcomeToDescription(value)}
          </span>
        );
      },
      sortDescFirst: true,
    }),
  ];
};
