import React from "react";
import { Dropdown } from "flowbite-react";
import { NavLink, useMatches } from "react-router-dom";
import { HiChevronRight } from "react-icons/hi";

type Props = {
  releaseId: string;
};

/**
 * A breadcrumb specifically for the Release sub pages.
 *
 * NOTE: this is possibly generaliseable for all pages - but until we need a second
 * breadcrumb (datasets?) I have left this specific for Releases.
 *
 * @param props
 * @constructor
 */
export const ReleasesBreadcrumbsDiv: React.FC<Props> = (props) => {
  const matches = useMatches();

  // find all the crumb text from our current matched route
  let crumbsText = matches
    .filter((match: any) => Boolean(match.handle?.crumbText))
    .map((match: any) => match.handle.crumbText);

  // find the last 'dropdownItems' component if present - as we will render that to our final dropdown
  const finalDropdownItems = matches
    .filter((match: any) => Boolean(match.handle?.dropdownItems))
    .map((match: any) => match.handle.dropdownItems());

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
              {props.releaseId}
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
    </nav>
  );
};
