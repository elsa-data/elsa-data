import classNames from "classnames";
import React, { ReactNode } from "react";
import { PaginatorLink } from "headless-pagination";

type Props = {
  // the word that describes each row (i.e. "cases", "datasets")
  rowWord: string;

  currentSearchText: string;

  setSearchText: (text: string) => void;
  clearSearchText: () => void;
};

/**
 * A searcher component styled to live at the top of one of our boxes - where the rest of the box is
 * the searchable table content.
 *
 * @param props
 * @constructor
 */
export const BoxSearcher: React.FC<Props> = (props) => {
  return (
    <div className="border-b bg-gray-50 px-4 py-3 text-left sm:px-6">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            aria-hidden="true"
            className="h-5 w-5 text-gray-500"
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
          className="block w-full rounded-lg border border-gray-300 p-4 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          placeholder="Search Identifiers"
          value={props.currentSearchText}
          onChange={(e) => props.setSearchText(e.target.value)}
        />
        <button
          type="button"
          onClick={() => props.clearSearchText()}
          className="absolute right-2.5 bottom-2.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Clear
        </button>
      </div>{" "}
    </div>
  );
};
