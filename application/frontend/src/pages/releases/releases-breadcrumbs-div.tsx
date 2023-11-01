import React from "react";
import { NavLink, useMatches } from "react-router-dom";
import { HiChevronRight, HiOutlineReply } from "react-icons/hi";
import { ReleaseTypeLocal } from "./shared-types";

export type BreadcrumbDropDownEntry = {
  id: string;
  to: string;
  text: string;
};

/**
 * A breadcrumb specifically for the Release sub-pages.
 *
 * NOTE: this is possibly generaliseable for all pages - but until we need a second
 * breadcrumb (datasets?) I have left this specific for Releases.
 *
 * @param props
 * @constructor
 */
export const ReleasesBreadcrumbsDiv: React.FC<{
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
}> = (props) => {
  const matches = useMatches();

  // find the last 'siblingItems' which has details of our siblings
  const siblingList = matches
    .filter((match: any) => Boolean(match.handle?.siblingItems))
    .map((match: any) => match.handle.siblingItems);

  const lastSiblingItems: BreadcrumbDropDownEntry[] =
    siblingList.length > 0 ? siblingList.slice(-1)[0] : [];

  const finalSiblingItems = lastSiblingItems.filter(
    (si) =>
      // Don't show the "Jobs" breadcrumb for non-admins
      si.id !== "jobs" ||
      props.releaseData.roleInRelease === "Administrator" ||
      props.releaseData.roleInRelease === "AdminView",
  );

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
              {props.releaseKey.substring(0, 8).toUpperCase()}
            </span>
          </div>
        </li>
        {finalSiblingItems && (
          <li>
            <div className="flex items-center">
              <HiChevronRight className="mr-2 min-w-fit" />

              <div tabIndex={0} className="flex flex-wrap">
                {finalSiblingItems.map((f, i) => (
                  <div key={i} className="inline-block whitespace-nowrap">
                    <NavLink to={f.to} className="link text-sm">
                      {({ isActive }) => (
                        <span className={isActive ? "font-bold" : ""}>
                          {f.text}
                        </span>
                      )}
                    </NavLink>
                    {i != finalSiblingItems.length - 1 && (
                      <span key={i + "span"} className="mx-4 text-sm">
                        /
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </li>
        )}
      </ol>
    </nav>
  );
};
