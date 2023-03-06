import React from "react";
import { Dropdown } from "flowbite-react";
import { NavLink, useMatches } from "react-router-dom";
import { HiChevronRight, HiOutlineReply } from "react-icons/hi";

export type BreadcrumbDropDownEntry = {
  to: string;
  text: string;
};

const BreadcrumbDropdownItem: React.FC<BreadcrumbDropDownEntry> = ({
  to,
  text,
}) => (
  <NavLink to={to}>
    {({ isActive }) => (
      <Dropdown.Item
        className={isActive ? "font-bold text-gray-500" : "text-gray-500"}
      >
        {text}
      </Dropdown.Item>
    )}
  </NavLink>
);

/**
 * A breadcrumb specifically for the Release sub-pages.
 *
 * NOTE: this is possibly generaliseable for all pages - but until we need a second
 * breadcrumb (datasets?) I have left this specific for Releases.
 *
 * @param props
 * @constructor
 */
export const ReleasesBreadcrumbsDiv: React.FC<{ releaseId: string }> = (
  props
) => {
  const matches = useMatches();

  // find all the crumb text from our current matched route
  let crumbsText = matches
    .filter((match: any) => Boolean(match.handle?.crumbText))
    .map((match: any) => match.handle.crumbText);

  // find the last 'siblingItems' which has details of our siblings
  const siblingList = matches
    .filter((match: any) => Boolean(match.handle?.siblingItems))
    .map((match: any) => match.handle.siblingItems);

  const finalSiblingItems: BreadcrumbDropDownEntry[] =
    siblingList.length > 0 ? siblingList.slice(-1)[0] : [];

  return (
    <nav
      className="w-full justify-start px-4 py-3 text-gray-700 sm:flex sm:px-5"
      aria-label="Breadcrumb"
    >
      <ol className="mb-3 inline-flex items-center space-x-1 sm:mb-0 md:space-x-3">
        <li aria-current="page">
          <div className="flex items-center">
            <HiOutlineReply className="rotate-180" />
            <span className="ml-2 text-sm font-medium text-gray-500">
              {props.releaseId.substring(0, 8).toUpperCase()}
            </span>
          </div>
        </li>
        {finalSiblingItems && (
          <li>
            <div className="flex items-center">
              <HiChevronRight className="mr-2" />

              <div tabIndex={0} className="flex flex-wrap space-x-4">
                {finalSiblingItems.map((f, i) => (
                  <>
                    <NavLink key={i} to={f.to} className="link text-sm">
                      {({ isActive }) => (
                        <span className={isActive ? "font-bold" : ""}>
                          {f.text}
                        </span>
                      )}
                    </NavLink>
                    {i != finalSiblingItems.length - 1 && (
                      <span key={i + "span"} className="text-sm">
                        /
                      </span>
                    )}
                  </>
                ))}
              </div>

              {/*<div className="dropdown">
                <label tabIndex={0} className="btn m-1 btn-xs">
                  {crumbsText.slice(-1)}
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 text-xs shadow bg-base-100 rounded-box w-52"
                >
                  {finalSiblingItems.map((f, i) => (
                    <NavLink to={f.to}>
                      {({ isActive }) => (
                        <li key={i}>
                          <a className={isActive ? "font-bold text-gray-500" : "text-gray-500"}>{f.text}</a>
                        </li>
                      )}
                    </NavLink>
                  ))}
                </ul>
              </div>

              <Dropdown
                size="xs"
                label={crumbsText.slice(-1)}
                placement="bottom-end"
              >
                {finalSiblingItems.map((f, i) => (
                  <BreadcrumbDropdownItem key={i} to={f.to} text={f.text} />
                ))}
              </Dropdown> */}
            </div>
          </li>
        )}
      </ol>
    </nav>
  );
};
