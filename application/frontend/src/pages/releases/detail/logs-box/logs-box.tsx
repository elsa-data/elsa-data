import React, {
  useState,
  Fragment,
  useEffect,
  Dispatch,
  SetStateAction,
  useCallback,
  useRef,
} from "react";
import { AuditEntryType } from "@umccr/elsa-types";
import axios from "axios";
import {
  QueryObserver,
  useQueries,
  useQuery,
  UseQueryResult,
} from "react-query";
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
  getSortedRowModel,
  Row,
  RowData,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  formatDuration,
  formatLocalDateTime,
  formatFromNowTime,
} from "../../../../helpers/datetime-helper";
import {
  AuditEntryDetailsType,
  AuditEntrySchema,
} from "@umccr/elsa-types/schemas-audit";
import { SortDirection } from "@tanstack/table-core";
import Popup from "reactjs-popup";
import { PopupPosition } from "reactjs-popup/dist/types";
import dayjs from "dayjs";

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

type ToolTipProps = {
  trigger: JSX.Element;
  description: string;
  position?: PopupPosition;
};

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

export const LogsBox = ({ releaseId, pageSize }: LogsBoxProps): JSX.Element => {
  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState(1);

  // very briefly whilst the first page is downloaded we estimate that we have only one entry
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
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: " ^",
                          desc: " v",
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isSuccess &&
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <tr
                    key={row.id}
                    onClick={() =>
                      row.getCanExpand() &&
                      row.getValue("hasDetails") &&
                      row.toggleExpanded()
                    }
                    className="border-b pl-2 pr-2"
                  >
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

const ToolTip = ({
  trigger,
  description,
  position = "left top",
}: ToolTipProps): JSX.Element => {
  return (
    <Popup trigger={trigger} position={position} on={["hover", "focus"]}>
      <div>{description}</div>
    </Popup>
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
            {table.getIsAllRowsExpanded() ? "x" : "o"}
          </button>
        ) : (
          ""
        );
      },
      cell: (info) => {
        return info.row.getCanExpand() && info.getValue() ? (
          <div>{info.row.getIsExpanded() ? "x" : "o"}</div>
        ) : (
          ""
        );
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
            description={formatLocalDateTime(dateTime)}
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
