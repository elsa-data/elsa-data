import React from "react";
import {
  ColumnDef,
  createTable,
  getCoreRowModel,
  PaginationState,
  useTableInstance,
} from "@tanstack/react-table";

import { ReleaseCaseType } from "@umccr/elsa-types";
import axios from "axios";
import { useQuery, useQueryClient } from "react-query";
import { IndeterminateCheckbox } from "../components/indeterminate-checkbox";
import { ReleasesCasesPatientsFlexRow } from "./releases-cases-patients-flex-row";

let table = createTable().setRowType<ReleaseCaseType>();

type Props = {
  releaseId: string;

  // a map of every dataset uri we will encounter to a single letter
  datasetMap: Map<string, string>;

  // whether the table is being viewed by someone with permissions to edit it
  isEditable: boolean;
};

export const ReleasesCasesTable: React.FC<Props> = ({
  releaseId,
  datasetMap,
  isEditable,
}) => {
  const queryClient = useQueryClient();

  const columnList = (isEditable: boolean) => {
    const cols = [];

    cols.push(
      table.createDataColumn((row) => row.fromDatasetUri, {
        id: "fromDatasetUri",
        cell: (info) => <span>{datasetMap.get(info.getValue())}</span>,
        header: (h) => "",
        footer: (props) => props.column.id,
      })
    );

    if (isEditable) {
      cols.push(
        table.createDataColumn("nodeStatus", {
          header: (h) => "",
          cell: (info) => (
            <IndeterminateCheckbox
              disabled={true}
              checked={info.getValue() === "selected"}
              indeterminate={info.getValue() === "indeterminate"}
              onChange={() => {
                console.log("changed");
              }}
            />
          ),
          footer: (props) => props.column.id,
        })
      );
    }

    cols.push(
      table.createDataColumn("externalId", {
        header: (h) => "Id",
        cell: (info) => info.getValue(),
        footer: (props) => props.column.id,
      })
    );
    cols.push(
      table.createDataColumn((row) => row.patients, {
        id: "patients",
        cell: (info) => (
          <ReleasesCasesPatientsFlexRow
            releaseId={releaseId}
            patients={info.getValue()}
            showCheckboxes={isEditable}
          />
        ),
        header: () => <span>Patients and Specimens</span>,
        footer: (props) => props.column.id,
      })
    );

    return cols;
  };

  const columns = React.useMemo(
    () => columnList(isEditable),
    [isEditable, datasetMap, releaseId]
  );

  const [{ pageIndex, pageSize }, setPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 3,
    });

  const fetchDataOptions = {
    pageIndex,
    pageSize,
  };

  const dataQuery = useQuery(
    ["releases-cases", fetchDataOptions, releaseId],
    async () => {
      const releaseCases = await axios
        .get<ReleaseCaseType[]>(
          `/api/releases/${releaseId}/cases?page=${fetchDataOptions.pageIndex}`
        )
        .then((response) => response.data);

      return {
        rows: releaseCases,
        pageCount: undefined,
      };
    },
    { keepPreviousData: true }
  );

  const defaultData = React.useMemo(() => [], []);

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  const instance = useTableInstance(table, {
    data: dataQuery.data?.rows ?? defaultData,
    columns,
    pageCount: dataQuery.data?.pageCount ?? -1,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    // getPaginationRowModel: getPaginationRowModel(), // If only doing manual pagination, you don't need this
    debugTable: true,
  });

  const headerClasses: { [headerId: string]: string } = {
    fromDatasetUri: "w-8",
    nodeStatus: "w-8",
    externalId: "w-40",
    patients: "text-left",
  };

  return (
    <>
      <table className="w-full text-sm text-left text-gray-500 table-fixed">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b-4 border-gray-200">
          {instance.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="py-4">
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    className={headerClasses[header.id]}
                    key={header.id}
                    colSpan={header.colSpan > 1 ? header.colSpan : undefined}
                  >
                    {header.isPlaceholder ? null : (
                      <div>{header.renderHeader()}</div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {/* https://github.com/TanStack/table/discussions/2233  for data set merging.. simple A, B, C */}
          {instance.getRowModel().rows.map((row) => {
            return (
              <tr
                key={row.id}
                className="border-b odd:bg-white even:bg-gray-50"
              >
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td
                      className="py-4 text-left font-medium text-gray-900 whitespace-nowrap"
                      key={cell.id}
                    >
                      {cell.renderCell()}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="h-2" />
      <div className="flex items-center gap-2">
        <button
          className="border rounded p-1"
          onClick={() => instance.setPageIndex(0)}
          disabled={!instance.getCanPreviousPage()}
        >
          {"<<"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => instance.previousPage()}
          disabled={!instance.getCanPreviousPage()}
        >
          {"<"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => instance.nextPage()}
          disabled={!instance.getCanNextPage()}
        >
          {">"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => instance.setPageIndex(instance.getPageCount() - 1)}
          disabled={!instance.getCanNextPage()}
        >
          {">>"}
        </button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {instance.getState().pagination.pageIndex + 1} of{" "}
            {instance.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            defaultValue={instance.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              instance.setPageIndex(page);
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={instance.getState().pagination.pageSize}
          onChange={(e) => {
            instance.setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
        {dataQuery.isFetching ? "Loading..." : null}
      </div>
      <div>{instance.getRowModel().rows.length} Rows</div>
    </>
  );
};
