import classNames from "classnames";
import React from "react";
import { isString } from "lodash";
import { Pagination } from "react-headless-pagination";

type Props = {
  // the word that describes each row (i.e. "cases", "patients", "datasets")
  rowWord: string;

  // the total number of rows that we will be scrolling/paging through
  rowCount: number;

  // the maximum number of rows to display on one page (i.e. page limit)
  rowsPerPage: number;

  // if present, enables a replacement of the paging mechanism for when there is search text
  currentSearchText?: string;
  setSearchText?: (text: string) => void;
  clearSearchText?: () => void;

  // the state variable holding the current page
  currentPage: number;

  // these props are from the header paginator component - created in the parent box
  setPage: (newPage: number) => void;
};

/**
 * A paginator component styled to live at the top of one of our boxes - where the rest of the box is
 * the paged table content.
 *
 * @param props
 * @constructor
 */
export const BoxPaginator: React.FC<Props> = (props) => {
  // if in the process of them entering search text - we want the UI to change slightly
  // note that we also check to make sure the search functionality is enabled (set/clear must be non-null)
  const isTextSearchHappening =
    props.setSearchText &&
    props.clearSearchText &&
    isString(props.currentSearchText) &&
    props.currentSearchText!.length > 0;

  // for our pagination buttons and text we need to do some page calculations
  const maxPage = Math.ceil(props.rowCount / props.rowsPerPage);
  const from = (props.currentPage - 1) * props.rowsPerPage + 1;
  const to = Math.min(
    (props.currentPage - 1) * props.rowsPerPage + props.rowsPerPage,
    props.rowCount
  );

  return (
    <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-b">
      <>
        {/* prev/next buttons only on small devices */}
        <div className="flex-1 flex justify-between sm:hidden">
          <a
            onClick={() => props.setPage(props.currentPage - 1)}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Previous
          </a>
          {/* TODO what about the search UI on small devices? */}
          <a
            onClick={() => props.setPage(props.currentPage + 1)}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Next
          </a>
        </div>
        {/* a full pagination UI if space */}
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          {!isTextSearchHappening && (
            <div className="mr-8">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{from}</span> to{" "}
                <span className="font-medium">{to}</span> of{" "}
                <span className="font-medium">{props.rowCount}</span>{" "}
                {props.rowWord}
              </p>
            </div>
          )}
          {/* the search UI is only enabled if set/clear action functions are provided */}
          {props.setSearchText && props.clearSearchText && (
            <div className="relative sm:grow">
              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <input
                type="search"
                className="block px-4 pl-10 w-full text-sm text-gray-700 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search Identifiers"
                value={props.currentSearchText}
                onChange={(e) => props.setSearchText!(e.target.value)}
              />
            </div>
          )}
          {!isTextSearchHappening && (
            <div className="ml-8">
              <Pagination
                currentPage={props.currentPage - 1}
                setCurrentPage={(p: number) => props.setPage(p + 1)}
                totalPages={maxPage}
                edgePageCount={2}
                middlePagesSiblingCount={1}
                className="relative z-0 inline-flex text-sm text-gray-700 -space-x-px"
                truncableText="..."
                truncableClassName="w-10 px-0.5 text-center"
              >
                <Pagination.PrevButton
                  className={classNames(
                    "flex items-center mr-2 text-gray-700 hover:text-gray-600 focus:outline-none",
                    {
                      "cursor-pointer": props.currentPage !== 1,
                      "opacity-50": props.currentPage === 1,
                    }
                  )}
                >
                  <span className="sr-only">Previous</span>
                  <span className="h-5 w-5" aria-hidden="true">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="icon icon-tabler icon-tabler-chevron-left mx-auto stroke-gray-500"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="#597e8d"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <polyline points="15 6 9 12 15 18" />
                    </svg>
                  </span>
                </Pagination.PrevButton>

                <div className="flex items-center justify-center flex-grow">
                  <Pagination.PageButton
                    activeClassName="bg-blue-50 text-blue-600"
                    inactiveClassName="text-gray-500"
                    className={
                      "flex items-center justify-center h-10 w-10 rounded-full cursor-pointer"
                    }
                  />
                </div>

                <Pagination.NextButton
                  className={classNames(
                    "flex items-center ml-2 text-gray-700 hover:text-gray-600 focus:outline-none",
                    {
                      "cursor-pointer": props.currentPage !== maxPage,
                      "opacity-50": props.currentPage === maxPage,
                    }
                  )}
                >
                  <span className="sr-only">Next</span>
                  <span className="h-5 w-5" aria-hidden="true">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="icon icon-tabler icon-tabler-chevron-right mx-auto stroke-gray-500"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <polyline points="9 6 15 12 9 18" />
                    </svg>
                  </span>
                </Pagination.NextButton>
              </Pagination>
            </div>
          )}
        </div>
      </>
    </div>
  );
};
