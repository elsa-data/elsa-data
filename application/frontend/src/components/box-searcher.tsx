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
    <div className="px-4 py-3 bg-gray-50 text-left sm:px-6 border-b">
      <div className="relative">
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
          className="block p-4 pl-10 w-full text-sm text-gray-900 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search Identifiers"
          value={props.currentSearchText}
          onChange={(e) => props.setSearchText(e.target.value)}
        />
        <button
          type="button"
          onClick={() => props.clearSearchText()}
          className="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Clear
        </button>
      </div>{" "}
    </div>
  );
};
