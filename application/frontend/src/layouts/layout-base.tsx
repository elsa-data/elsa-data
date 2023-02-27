import React, { useState, PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { useLoggedInUser } from "../providers/logged-in-user-provider";
import { LayoutBaseHeaderUser } from "./layout-base-header-user";
import { ErrorBoundary } from "../components/errors";

type Props = {};

// https://github.com/tailwindtoolbox/Admin-Template-Day

export const LayoutBase: React.FC<PropsWithChildren<Props>> = ({
  children,
}) => {
  const [isMenuBarOpen, setIsMenuBarOpen] = useState<boolean>(false);

  const navLink = (
    to: string,
    label: string,
    textClass: string,
    borderClass: string,
    hoverClass: string
  ) => {
    const always =
      "block py-1 md:py-3 pl-1 align-middle no-underline border-b-2";
    const whenActive = `${textClass} ${borderClass} ${hoverClass} ${always}`;
    const whenInactive = `text-gray-500 border-white ${hoverClass} ${always}`;

    return (
      <div className="my-2 mr-6 md:my-0">
        <NavLink
          to={to}
          className={({ isActive }) => (isActive ? whenActive : whenInactive)}
        >
          <span className="pb-1 text-sm md:pb-0">{label}</span>
        </NavLink>
      </div>
    );
  };

  const loggedInUser = useLoggedInUser();

  return (
    <>
      {/* NAV START */}
      <nav
        id="header"
        className="fixed top-0 z-10 w-full min-w-max bg-white shadow"
      >
        <div className="container mx-auto w-full">
          <div className="mt-0 flex w-full flex-wrap items-center justify-between pt-3 pb-3 lg:pb-0">
            <div className="block pr-4 lg:hidden">
              <button
                onClick={() => setIsMenuBarOpen((prev: boolean) => !prev)}
                id="nav-toggle"
                className="flex appearance-none items-center rounded border border-gray-600 px-3 py-2 text-gray-500 hover:border-teal-500 hover:text-gray-900 focus:outline-none"
              >
                <svg
                  className="h-3 w-3 fill-current"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Menu</title>
                  <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
                </svg>
              </button>
            </div>

            <div className="pl-2 md:pl-0">
              <a
                className="text-base font-bold text-gray-900 no-underline hover:no-underline xl:text-xl"
                href="/"
              >
                Elsa Data
              </a>
            </div>
            <div className="relative float-right flex">
              {loggedInUser && <LayoutBaseHeaderUser user={loggedInUser} />}
            </div>
          </div>

          <div
            className={`mt-2 w-full flex-grow bg-white lg:mt-0 lg:flex lg:w-auto lg:items-center ${
              isMenuBarOpen ? "" : "hidden"
            }`}
            id="nav-content"
          >
            {loggedInUser ? (
              <ul className="list-reset flex-1 items-center px-4 pb-4 md:px-0 lg:flex lg:pb-0">
                <li className="my-2 mr-6 md:my-0">
                  {navLink(
                    "/",
                    "Home",
                    "text-orange-600",
                    "border-orange-600",
                    "hover:border-orange-600"
                  )}
                </li>
                <li className="my-2 mr-6 md:my-0">
                  {navLink(
                    "/releases",
                    "Releases",
                    "text-purple-500",
                    "border-purple-500",
                    "hover:border-purple-500"
                  )}
                </li>
                <li className="my-2 mr-6 md:my-0">
                  {navLink(
                    "/datasets",
                    "Datasets",
                    "text-green-500",
                    "border-green-500",
                    "hover:border-green-500"
                  )}
                </li>
                <li className="my-2 mr-6 md:my-0">
                  {navLink(
                    "/dac",
                    "DAC",
                    "text-yellow-500",
                    "border-yellow-500",
                    "hover:border-yellow-500"
                  )}
                </li>
                <li className="my-2 mr-6 md:my-0">
                  {navLink(
                    "/users",
                    "Users",
                    "text-rose-500",
                    "border-rose-500",
                    "hover:border-rose-500"
                  )}
                </li>
                <li className="my-2 mr-6 md:my-0">
                  {navLink(
                    `/audit-events/${loggedInUser.userId}`,
                    "Audit Events",
                    "text-rose-500",
                    "border-rose-500",
                    "hover:border-rose-500"
                  )}
                </li>
              </ul>
            ) : (
              <ul className="list-reset flex-1 items-center px-4 md:px-0 lg:flex">
                <li className="my-2 mr-6 md:my-0">
                  {navLink(
                    "/",
                    "Login",
                    "text-gray-500",
                    "border-gray-500",
                    "hover:border-gray-500"
                  )}
                </li>
              </ul>
            )}

            {/*<div className="relative pull-right pl-4 pr-4 md:pr-0">
              <input
                type="search"
                placeholder="Search"
                className="w-full bg-gray-100 text-sm text-gray-800 transition border focus:outline-none focus:border-gray-700 rounded py-1 px-2 pl-10 appearance-none leading-normal"
              />
            </div> */}
          </div>
        </div>
      </nav>
      {/* NAV END */}

      <div className="container mx-auto w-full grow pt-10 lg:pt-20">
        <div className="mt-8 mb-8 w-full leading-normal text-gray-800">
          <ErrorBoundary rethrowError={(_: any) => false}>
            {children}
          </ErrorBoundary>
        </div>
      </div>

      {/*<LayoutBaseFooter />*/}
    </>
  );
};
