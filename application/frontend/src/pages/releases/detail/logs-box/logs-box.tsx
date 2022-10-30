import React, {
  Dispatch,
  Fragment,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { AuditEntryType } from "@umccr/elsa-types";
import axios from "axios";
import { useQuery, UseQueryResult } from "react-query";
import { BoxNoPad } from "../../../../components/boxes";
import { BoxPaginator } from "../../../../components/box-paginator";
import {
  ColumnSizingHeader,
  CoreHeader,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  formatDuration,
  formatFromNowTime,
  formatLocalDateTime,
} from "../../../../helpers/datetime-helper";
import { AuditEntryDetailsType } from "@umccr/elsa-types/schemas-audit";
import {
  Table,
  TableData,
  TableHeader,
  TableRow,
} from "../../../../components/tables";
import { ToolTip } from "../../../../components/tooltip";

/**
 * Maximum character length of details rendered in log box.
 */
// Allow this to be set somewhere?
export const MAXIMUM_DETAIL_LENGTH = 1000;

type LogsBoxProps = {
  releaseId: string;
  // the (max) number of log items shown on any single page
  pageSize: number;
};

export type RowProps = {
  releaseId: string;
  objectId: string;
};

/**
 * Wrapper around a useQuery hook for an audit entry event.
 */
export const useAuditEventQuery = (
  currentPage: number,
  releaseId: string,
  orderByProperty: string,
  orderAscending: boolean,
  setCurrentTotal: Dispatch<SetStateAction<number>>,
  setData: Dispatch<SetStateAction<AuditEntryType[]>>,
  setIsSuccess: Dispatch<SetStateAction<boolean>>
) => {
  return useQuery(
    [
      "releases-audit-log",
      currentPage,
      releaseId,
      orderByProperty,
      orderAscending,
    ],
    async () => {
      return await axios
        .get<AuditEntryType[]>(
          `/api/releases/${releaseId}/audit-log?page=${currentPage}&orderByProperty=${orderByProperty}&orderAscending=${orderAscending}`
        )
        .then((response) => {
          const newTotal = parseInt(response.headers["elsa-total-count"]);

          if (isFinite(newTotal)) {
            setCurrentTotal(newTotal);
          }

          return response.data;
        });
    },
    {
      keepPreviousData: true,
      enabled: false,
      onSuccess: (data) => {
        setData(data ?? []);
        setIsSuccess(data !== undefined);
      },
    }
  );
};

/**
 * Declares all audit entry queries used by the logs box.
 */
export const useAllAuditEventQueries = (
  currentPage: number,
  releaseId: string,
  setCurrentTotal: Dispatch<SetStateAction<number>>,
  setData: Dispatch<SetStateAction<AuditEntryType[]>>,
  setIsSuccess: Dispatch<SetStateAction<boolean>>
): { [key: string]: UseQueryResult<AuditEntryType[]> } => {
  const useAuditEventQueryFn = (
    occurredDateTime: string,
    orderAscending: boolean
  ) => {
    return useAuditEventQuery(
      currentPage,
      releaseId,
      occurredDateTime,
      orderAscending,
      setCurrentTotal,
      setData,
      setIsSuccess
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

export type AuditEntryTableHeaderProps<TData, TValue> = {
  header: CoreHeader<TData, TValue> & ColumnSizingHeader;
};

export const AuditEntryTableHeader = <TData, TValue>({
  header,
}: AuditEntryTableHeaderProps<TData, TValue>): JSX.Element => {
  return (
    <div onClick={header.column.getToggleSortingHandler()}>
      {flexRender(header.column.columnDef.header, header.getContext())}
      {{
        asc: " ^",
        desc: " v",
      }[header.column.getIsSorted() as string] ?? null}
    </div>
  );
};

/**
 * The main logs box component.
 */
export const LogsBox = ({ releaseId, pageSize }: LogsBoxProps): JSX.Element => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTotal, setCurrentTotal] = useState(1);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [updateData, setUpdateData] = useState(true);

  const [data, setData] = useState([] as AuditEntryType[]);
  const [isSuccess, setIsSuccess] = useState(false);

  const dataQueries = useAllAuditEventQueries(
    currentPage,
    releaseId,
    setCurrentTotal,
    setData,
    setIsSuccess
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
    columns: createColumns(releaseId),
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

  const groups = table.getHeaderGroups();
  return (
    <BoxNoPad heading="Audit Logs">
      <div className="flex flex-col">
        <Table
          tableHead={groups.map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHeader key={header.id}>
                  {header.isPlaceholder ? undefined : (
                    <AuditEntryTableHeader header={header} />
                  )}
                </TableHeader>
              ))}
            </TableRow>
          ))}
          tableBody={
            isSuccess &&
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow
                  key={row.id}
                  onClick={() =>
                    row.getCanExpand() &&
                    row.getValue("hasDetails") &&
                    row.toggleExpanded()
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableData key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableData>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow key={row.original.objectId}>
                    <TableData
                      key={row.original.objectId}
                      colSpan={row.getVisibleCells().length}
                    >
                      <DetailsRow
                        releaseId={releaseId}
                        objectId={row.original.objectId}
                      />
                    </TableData>
                  </TableRow>
                )}
              </Fragment>
            ))
          }
        />
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
    </BoxNoPad>
  );
};

/**
 * The details row shown when clicking on a row.
 */
const DetailsRow = ({ releaseId, objectId }: RowProps): JSX.Element => {
  const detailsQuery = useQuery(
    ["releases-audit-log-details", objectId],
    async () => {
      return await axios
        .get<AuditEntryDetailsType | null>(
          `/api/releases/${releaseId}/audit-log/details?id=${objectId}&start=0&end=${MAXIMUM_DETAIL_LENGTH}`
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

export type ExpanderIndicatorProps = {
  isExpanded: boolean;
};

/**
 * An indicator for when a row is expanded.
 */
export const ExpandedIndicator = ({
  isExpanded,
}: ExpanderIndicatorProps): JSX.Element => {
  return <>{isExpanded ? "x" : "o"}</>;
};

/**
 * Create the column definition based on the audit entry type.
 */
export const createColumns = (releaseId: string) => {
  const columnHelper = createColumnHelper<AuditEntryType>();
  return [
    columnHelper.accessor("objectId", {
      header: () => null,
      cell: (info) => {
        return (
          <a href={`/releases/${releaseId}/audit-log/${info.getValue()}`}>
            {" "}
            view{" "}
          </a>
        );
      },
      enableSorting: false,
    }),
    columnHelper.accessor("hasDetails", {
      header: ({ table }) => {
        return table.getCanSomeRowsExpand() &&
          table
            .getRowModel()
            .rows.map((row) => row.getValue("hasDetails"))
            .some(Boolean) ? (
          <button
            {...{
              onClick: table.getToggleAllRowsExpandedHandler(),
            }}
          >
            <ExpandedIndicator
              isExpanded={table.getIsAllRowsExpanded()}
            ></ExpandedIndicator>
          </button>
        ) : null;
      },
      cell: (info) => {
        return info.row.getCanExpand() && info.getValue() ? (
          <ExpandedIndicator
            isExpanded={info.row.getIsExpanded()}
          ></ExpandedIndicator>
        ) : null;
      },
      enableSorting: false,
    }),
    columnHelper.accessor("occurredDateTime", {
      header: "Time",
      cell: (info) => {
        const dateTime = info.getValue() as string | undefined;
        return (
          <ToolTip
            trigger={<span>{formatFromNowTime(dateTime)}</span>}
            description={<div>{formatLocalDateTime(dateTime)}</div>}
          ></ToolTip>
        );
      },
      sortDescFirst: true,
    }),
    columnHelper.accessor("outcome", {
      header: "Outcome",
      sortDescFirst: true,
    }),
    columnHelper.accessor("actionCategory", {
      header: "Category",
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
