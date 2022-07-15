import React from "react";
import { ReleaseCaseType } from "@umccr/elsa-types";
import axios from "axios";
import { useQuery, useQueryClient } from "react-query";
import { IndeterminateCheckbox } from "../../../components/indeterminate-checkbox";
import { PatientsFlexRow } from "./patients-flex-row";
import classNames from "classnames";
import usePagination from "headless-pagination-react";

type Props = {
  releaseId: string;

  // a map of every dataset uri we will encounter to a single letter
  datasetMap: Map<string, string>;

  // whether the table is being viewed by someone with permissions to edit it
  isEditable: boolean;
};

const CasesPaginator: React.FC<{
  currentPage: number;
  pageSize: number;
  totalCount: number;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
}> = ({ currentPage, pageSize, totalCount, setPageIndex }) => {
  const { links, hasNext, hasPrevious, from, to, setPage, onNext, onPrevious } =
    usePagination({
      totalItems: totalCount,
      perPage: pageSize,
      maxLinks: 5,
      initialPage: currentPage,
    });

  const current = "z-10 bg-indigo-50 border-indigo-500 text-indigo-600";
  const notCurrent = "bg-white border-gray-300 text-gray-500 hover:bg-gray-50";

  return (
    <>
      {/* prev/next buttons only on small devices */}
      <div className="flex-1 flex justify-between sm:hidden">
        <a className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
          Previous
        </a>
        <a className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
          Next
        </a>
      </div>
      {/* a full pagination UI if space */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{from}</span> to{" "}
            <span className="font-medium">{to}</span> of{" "}
            <span className="font-medium">{totalCount}</span> cases
          </p>
        </div>
        <div>
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <a className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
              <span className="sr-only">Previous</span>
              <span className="h-5 w-5" aria-hidden="true">
                &lt;
              </span>
            </a>
            {links.map((link, i) => (
              <a
                key={i}
                aria-current="page"
                className={classNames(
                  link.active ? current : notCurrent,
                  "relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                )}
                onClick={() =>
                  typeof link.label !== "string"
                    ? setPageIndex(link.label)
                    : undefined
                }
              >
                {link.label}
              </a>
            ))}
            <a className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
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
};

export const CasesTable: React.FC<Props> = ({
  releaseId,
  datasetMap,
  isEditable,
}) => {
  const queryClient = useQueryClient();

  const [pageIndex, setPageIndex] = React.useState<number>(1);

  const dataQuery = useQuery(
    ["releases-cases", pageIndex, releaseId],
    async () => {
      return await axios
        .get<ReleaseCaseType[]>(
          `/api/releases/${releaseId}/cases?page=${pageIndex}`
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

  const baseColumnClasses = "py-4 font-medium text-gray-900 whitespace-nowrap";

  return (
    <>
      <div className="flex flex-col">
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          {dataQuery.isSuccess && (
            <CasesPaginator
              currentPage={pageIndex}
              setPageIndex={setPageIndex}
              totalCount={dataQuery.data.totalCount}
              pageSize={dataQuery.data.pageSize}
            />
          )}
        </div>
        <table className="w-full text-sm text-left text-gray-500 table-fixed">
          <tbody>
            {dataQuery.data &&
              dataQuery.data.rows.map((row) => {
                return (
                  <tr
                    key={row.id}
                    className="border-b bg-white hover:bg-blue-100"
                  >
                    <td
                      className={classNames(
                        baseColumnClasses,
                        "text-center",
                        "w-12"
                      )}
                    >
                      {datasetMap.get(row.fromDatasetId)}
                    </td>
                    <td className={classNames(baseColumnClasses, "w-8")}>
                      <IndeterminateCheckbox
                        disabled={true}
                        checked={row.nodeStatus === "selected"}
                        indeterminate={row.nodeStatus === "indeterminate"}
                        onChange={() => {
                          console.log("changed");
                        }}
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
                  </tr>
                );
              })}
          </tbody>
        </table>
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
