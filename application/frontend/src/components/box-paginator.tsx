import classNames from "classnames";
import React, { ReactNode } from "react";
import { PaginatorLink } from "headless-pagination";

type Props = {
  // the word that describes each row (i.e. "cases", "datasets")
  rowWord: string;

  // the total number of rows that we will be scrolling/paging through
  rowCount: number;

  // these props are from the header paginator component - created in the parent box
  setPage: (newPage: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  page: number;
  links: PaginatorLink[];
  hasNext: boolean;
  hasPrevious: boolean;
  from: number;
  to: number;
};

/**
 * A paginator component styled to live at the top of one of our boxes - where the rest of the box is
 * the paged table content.
 *
 * @param props
 * @constructor
 */
export const BoxPaginator: React.FC<Props> = (props) => {
  // styles for the page boxes - differing if the page is the 'current' page
  const currentClasses = "z-10 bg-indigo-50 border-indigo-500 text-indigo-600";
  const notCurrentClasses =
    "bg-white border-gray-300 text-gray-500 hover:bg-gray-50";

  return (
    <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-b">
      <>
        {/* prev/next buttons only on small devices */}
        <div className="flex-1 flex justify-between sm:hidden">
          <a
            onClick={() => props.onPrevious()}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Previous
          </a>
          <a
            onClick={() => props.onNext()}
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
              <span className="font-medium">{Math.max(props.from, 1)}</span> to{" "}
              <span className="font-medium">
                {Math.min(props.to, props.rowCount)}
              </span>{" "}
              of <span className="font-medium">{props.rowCount}</span>{" "}
              {props.rowWord}
            </p>
          </div>
          <div>
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <a
                onClick={() => props.onPrevious()}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
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
              </a>
              {props.links.map((link, i) => (
                <a
                  key={i}
                  aria-current="page"
                  className={classNames(
                    link.active ? currentClasses : notCurrentClasses,
                    "relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  )}
                  onClick={() =>
                    typeof link.label !== "string"
                      ? props.setPage(link.label)
                      : undefined
                  }
                >
                  {link.label}
                </a>
              ))}
              <a
                onClick={() => props.onNext()}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
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
              </a>
            </nav>
          </div>
        </div>
      </>
    </div>
  );
};
