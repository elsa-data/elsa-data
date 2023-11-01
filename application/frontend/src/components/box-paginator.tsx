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
  onSearchTextChange?: (text: string) => void;

  // the state variable holding the current page
  currentPage: number;

  // these props are from the header paginator component - created in the parent box
  setPage: (newPage: number) => void;

  isLoading?: boolean;
};

/**
 * A paginator component styled to live at the top of one of our boxes - where the rest of the box is
 * the paged table content.
 *
 * @param props
 * @constructor
 */
export const BoxPaginator: React.FC<Props> = (props) => {
  // for our pagination buttons and text we need to do some page calculations
  const maxPage = Math.ceil(props.rowCount / props.rowsPerPage);
  const from = Math.min(
    (props.currentPage - 1) * props.rowsPerPage + 1,
    props.rowCount,
  );
  const to = Math.min(
    (props.currentPage - 1) * props.rowsPerPage + props.rowsPerPage,
    props.rowCount,
  );

  const textSearchInProgress =
    props.isLoading === true &&
    !!props.currentSearchText &&
    props.currentSearchText.trim().length > 0;

  return (
    <div className="border-b bg-gray-50 px-4 py-3 text-right sm:px-6">
      <>
        {/* prev/next buttons only on small devices */}
        <div className="flex flex-1 justify-between sm:hidden">
          <a
            onClick={() => props.setPage(props.currentPage - 1)}
            className={classNames(
              "relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50",
              {
                "cursor-pointer": props.currentPage !== 1,
                "pointer-events-none opacity-50": props.currentPage === 1,
              },
            )}
          >
            Previous
          </a>
          {/* TODO what about the search UI on small devices? */}
          <a
            onClick={() => props.setPage(props.currentPage + 1)}
            className={classNames(
              "relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50",
              {
                "cursor-pointer": props.currentPage !== maxPage,
                "pointer-events-none opacity-50": props.currentPage === maxPage,
              },
            )}
          >
            Next
          </a>
        </div>

        {/* a full pagination UI if space */}
        <div className="hidden h-10 sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div
            className={classNames("mr-8 min-w-[200px]", {
              "animate-pulse rounded-full bg-gray-200": textSearchInProgress,
            })}
          >
            <p
              className={classNames("text-left text-sm text-gray-700", {
                invisible: textSearchInProgress,
              })}
            >
              Showing <span className="font-medium">{from}</span> to{" "}
              <span className="font-medium">{to}</span> of{" "}
              <span className="font-medium">{props.rowCount}</span>{" "}
              {props.rowWord}
            </p>
          </div>

          {/* the search UI is only enabled if set/clear action functions are provided */}
          {props.onSearchTextChange && (
            <div className="relative sm:grow">
              <input
                type="search"
                className="input input-sm w-full"
                placeholder="Search Identifiers"
                value={props.currentSearchText}
                onChange={(e) => props.onSearchTextChange!(e.target.value)}
              />
            </div>
          )}
          <div
            className={classNames(
              "ml-8 flex min-w-[250px] items-center justify-end",
              {
                "animate-pulse rounded-full bg-gray-200": textSearchInProgress,
              },
            )}
          >
            <Pagination
              currentPage={props.currentPage - 1}
              setCurrentPage={(p: number) => props.setPage(p + 1)}
              totalPages={maxPage}
              edgePageCount={2}
              middlePagesSiblingCount={1}
              className={classNames(
                "relative z-0 inline-flex -space-x-px text-sm text-gray-700",
                { invisible: textSearchInProgress },
              )}
              truncableText="..."
              truncableClassName="w-10 px-0.5 text-center"
            >
              <Pagination.PrevButton
                className={classNames(
                  "mr-2 flex items-center text-gray-700 hover:text-gray-600 focus:outline-none",
                  {
                    "cursor-pointer": props.currentPage !== 1,
                    "opacity-50": props.currentPage === 1,
                  },
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

              <div className="flex flex-grow items-center justify-center">
                <Pagination.PageButton
                  activeClassName="bg-blue-50 text-blue-600"
                  inactiveClassName="text-gray-500"
                  className={
                    "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full"
                  }
                />
              </div>

              <Pagination.NextButton
                className={classNames(
                  "ml-2 flex items-center text-gray-700 hover:text-gray-600 focus:outline-none",
                  {
                    "cursor-pointer": props.currentPage !== maxPage,
                    "opacity-50": props.currentPage === maxPage,
                  },
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
        </div>
      </>
    </div>
  );
};
