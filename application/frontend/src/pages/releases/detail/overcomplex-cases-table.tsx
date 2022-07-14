import React from "react";
import {
  ColumnDef,
  createTable,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useTableInstance,
} from "@tanstack/react-table";

import { ReleaseCaseType } from "@umccr/elsa-types";
import axios from "axios";
import { useQuery, useQueryClient } from "react-query";
import { IndeterminateCheckbox } from "../../../components/indeterminate-checkbox";
import { PatientsFlexRow } from "./patients-flex-row";
import classNames from "classnames";
import { isNumber } from "lodash";

let table = createTable().setRowType<ReleaseCaseType>();

type Props = {
  releaseId: string;

  // a map of every dataset uri we will encounter to a single letter
  datasetMap: Map<string, string>;

  // whether the table is being viewed by someone with permissions to edit it
  isEditable: boolean;
};

export const CasesTable: React.FC<Props> = ({
  releaseId,
  datasetMap,
  isEditable,
}) => {
  const queryClient = useQueryClient();

  /**
   * Dynamically create a column list - parametrised by some simple settings.
   *
   * @param isEditable whether to show any of the columns in 'edit' mode
   */
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
          <PatientsFlexRow
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

  const [{ pageIndex }, setPagination] = React.useState<PaginationState>({
    pageIndex: 1,
    pageSize: 0, // NOTE: not used
  });

  const fetchDataOptions = {
    pageIndex,
  };

  const dataQuery = useQuery(
    ["releases-cases", fetchDataOptions, releaseId],
    async () => {
      return await axios
        .get<ReleaseCaseType[]>(
          `/api/releases/${releaseId}/cases?page=${fetchDataOptions.pageIndex}`
        )
        .then((response) => {
          const totalCount = parseInt(response.headers["elsa-total-count"]);
          const lastPage = parseInt(response.headers["elsa-last-page"]);
          const pageSize = parseInt(response.headers["elsa-page-size"]);

          return {
            rows: response.data,
            pageCount: isFinite(lastPage) ? lastPage - 1 : 0,
            pageSize: isFinite(pageSize) ? pageSize : 0,
            totalCount: isFinite(totalCount) ? totalCount : 0,
          };
        });
    },
    { keepPreviousData: true }
  );

  const defaultData = React.useMemo(() => [], []);

  const pagination = React.useMemo(
    () => ({
      pageIndex,
    }),
    [pageIndex]
  );

  const instance = useTableInstance(table, {
    data: dataQuery.data?.rows ?? defaultData,
    columns,
    pageCount: dataQuery.data?.pageCount ?? -1,
    //state: {
    //  pagination,
    //},
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    // getPaginationRowModel: getPaginationRowModel(), // If only doing manual pagination, you don't need this
    debugTable: true,
  });

  // allows us to impose custom classes on a per-column basis
  const columnClasses: { [columnId: string]: string } = {
    fromDatasetUri: "text-center w-12",
    nodeStatus: "w-8",
    externalId: "text-left w-40",
    patients: "text-left pr-4",
  };

  const paginationFooter = (
    <>
      {/* prev/next buttons only on small devices */}
      <div className="flex-1 flex justify-between sm:hidden">
        <a
          onClick={() => instance.previousPage()}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Previous
        </a>
        <a
          onClick={() => instance.nextPage()}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Next
        </a>
      </div>
      {/* a full pagination UI if space */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">{dataQuery.data?.pageSize}</span> to{" "}
            <span className="font-medium">10</span> of{" "}
            <span className="font-medium">{dataQuery.data?.totalCount}</span>{" "}
            cases {dataQuery.isFetching ? <span>...</span> : <></>}
          </p>
        </div>
        <div>
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <a
              onClick={() => instance.previousPage()}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <span className="sr-only">Previous</span>
              <span className="h-5 w-5" aria-hidden="true">
                &lt;
              </span>
            </a>
            {/* Current: "z-10 bg-indigo-50 border-indigo-500 text-indigo-600", Default: "bg-white border-gray-300 text-gray-500 hover:bg-gray-50" */}
            <a
              onClick={() => instance.setPageIndex(0)}
              aria-current="page"
              className="z-10 bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
            >
              1
            </a>
            <a
              onClick={() => instance.setPageIndex(1)}
              className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
            >
              2
            </a>
            <a
              onClick={() => instance.setPageIndex(2)}
              className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hidden md:inline-flex relative items-center px-4 py-2 border text-sm font-medium"
            >
              3
            </a>
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
              ...
            </span>
            <a
              href="#"
              className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hidden md:inline-flex relative items-center px-4 py-2 border text-sm font-medium"
            >
              8
            </a>
            <a
              href="#"
              className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
            >
              9
            </a>
            <a
              href="#"
              className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
            >
              10
            </a>
            <a
              href="#"
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <span className="sr-only">Next</span>
              <span className="h-5 w-5" aria-hidden="true">
                &gt;&gt;
              </span>
            </a>
          </nav>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="flex flex-col">
        <table className="w-full text-sm text-left text-gray-500 table-fixed">
          <tbody>
            {/* https://github.com/TanStack/table/discussions/2233  for data set merging.. simple A, B, C */}
            {instance.getRowModel().rows.map((row) => {
              return (
                <tr
                  key={row.id}
                  className="border-b bg-white hover:bg-blue-100"
                >
                  {/*odd:bg-white even:bg-gray-50 */}
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td
                        className={classNames(
                          "py-4 font-medium text-gray-900 whitespace-nowrap",
                          columnClasses[cell.column.id]
                        )}
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
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          {paginationFooter}
        </div>
      </div>
    </>
  );
};

{
  /*
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

 
 */
}
