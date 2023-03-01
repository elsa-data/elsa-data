import React, { SyntheticEvent, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileContract } from "@fortawesome/free-solid-svg-icons";
import { Breadcrumb, Dropdown } from "flowbite-react";
import { useMatches } from "react-router-dom";
import BreadcrumbItem from "flowbite-react/lib/esm/components/Breadcrumb/BreadcrumbItem";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { Link, NavLink } from "react-router-dom";

type Props = {
  releaseId: string;
};

/**
 * @param releaseId
 * @constructor
 */
export const BreadcrumbsDiv: React.FC<Props> = (props) => {
  const matches = useMatches();

  console.log(matches);

  // find all the crumb text from our current matched route
  let crumbsText = matches
    .filter((match: any) => Boolean(match.handle?.crumbText))
    .map((match: any) => match.handle.crumbText);

  // find the last 'dropdownItems' component if present - as we will render that to our final dropdown
  const finalDropdownItems = matches
    .filter((match: any) => Boolean(match.handle?.dropdownItems))
    .map((match: any) => match.handle.dropdownItems());

  console.log(finalDropdownItems);

  return (
    <nav
      className="w-full justify-start px-4 py-3 text-gray-700 sm:flex sm:px-5"
      aria-label="Breadcrumb"
    >
      <ol className="mb-3 inline-flex items-center space-x-1 sm:mb-0 md:space-x-3">
        <li>
          <div className="flex items-center">
            <NavLink
              to="../.."
              className="ml-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-500"
            >
              Releases
            </NavLink>
          </div>
        </li>
        <li aria-current="page">
          <div className="flex items-center">
            <HiChevronRight />
            <span className="ml-2 text-sm font-medium text-gray-500">
              C5YR7P2PE1
            </span>
          </div>
        </li>
        <li>
          <div className="flex items-center">
            <HiChevronRight className="mr-2" />

            <Dropdown
              size="xs"
              label={crumbsText.slice(-1)}
              placement="bottom-end"
            >
              {finalDropdownItems}
            </Dropdown>
          </div>
        </li>
      </ol>
      <div
        id="dropdown"
        className="z-10 hidden w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700"
      >
        <ul
          className="py-2 text-sm text-gray-700 dark:text-gray-200"
          aria-labelledby="dropdownDefault"
        >
          {/* <NavLink
            to="user-management"
            className="font-medium text-blue-600 underline hover:no-underline"
          >
            User Management
          </NavLink>
          <NavLink
            to="audit-log"
            className="font-medium text-blue-600 underline dark:text-blue-500 hover:no-underline"
          >
            Audit Log
          </NavLink>
          <NavLink
            to="data-access-log"
            className="font-medium text-blue-600 underline dark:text-blue-500 hover:no-underline"
          >
            Data Access Log
          </NavLink> */}
          <li>
            <a
              href="#"
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              New branch
            </a>
          </li>
          <li>
            <a
              href="#"
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              Rename
            </a>
          </li>
          <li>
            <a
              href="#"
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              Delete
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};
