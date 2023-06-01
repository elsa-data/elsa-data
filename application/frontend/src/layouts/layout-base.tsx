import React, { PropsWithChildren, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useLoggedInUser } from "../providers/logged-in-user-provider";
import { LayoutBaseHeaderUser } from "./layout-base-header-user";
import { ErrorBoundary } from "../components/errors";
import { LayoutBaseFooter } from "./layout-base-footer";
import { useUiAllowed } from "../hooks/ui-allowed";
import { ALLOWED_CREATE_NEW_RELEASE } from "@umccr/elsa-constants";
import { useEnvRelay } from "../providers/env-relay-provider";

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
      <div className="my-2  md:my-0">
        <NavLink
          to={to}
          className={({ isActive }) => (isActive ? whenActive : whenInactive)}
          onClick={() => setIsMenuBarOpen(false)}
        >
          <span className="pb-1 text-sm md:pb-0">{label}</span>
        </NavLink>
      </div>
    );
  };

  const loggedInUser = useLoggedInUser();

  const uiAllowed = useUiAllowed();

  const envRelay = useEnvRelay();

  return (
    <>
      {/* NAV START */}
      <nav
        id="header"
        className="fixed top-0 z-10 w-full min-w-max bg-white shadow"
      >
        <div className="container mx-auto w-full px-2">
          <div className="mt-0 w-full items-center justify-between pt-3 pb-3 lg:pb-0">
            <div className="block flex w-full justify-between lg:hidden">
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
              <div className="flex items-center justify-between gap-x-2 md:pl-0 lg:hidden">
                <a
                  className="text-base font-bold text-gray-900 no-underline hover:no-underline xl:text-xl"
                  href="/"
                >
                  {envRelay.documentTitle}
                </a>
                {envRelay.brandLogoUriRelative && (
                  <img
                    className="max-h-10"
                    src={envRelay.brandLogoUriRelative}
                    alt={`${envRelay.brandName ?? ""} logo`.trim()}
                  />
                )}
              </div>
              {loggedInUser && (
                <div className="my-1.5">
                  <LayoutBaseHeaderUser user={loggedInUser} />
                </div>
              )}
            </div>

            <div className="hidden w-full items-center justify-between md:pl-0 lg:flex">
              <a
                className="text-base font-bold text-gray-900 no-underline hover:no-underline xl:text-xl"
                href="/"
              >
                {envRelay.documentTitle}
              </a>
              {envRelay.brandLogoUriRelative && (
                <img
                  className="max-h-10"
                  src={envRelay.brandLogoUriRelative}
                  alt={`${envRelay.brandName ?? ""} logo`.trim()}
                />
              )}
            </div>
          </div>

          <div className="flex w-full flex-row justify-between">
            <div
              className={`mt-2 w-full bg-white lg:mt-0 lg:inline-block ${
                isMenuBarOpen ? "" : "hidden"
              }`}
              id="nav-content"
            >
              {loggedInUser ? (
                <ul className="list-reset flex-1 items-center px-4 pb-4 md:px-0 lg:flex lg:space-x-12 lg:pb-0">
                  <li className="my-2 md:my-0">
                    {navLink(
                      "/releases",
                      "Releases",
                      "text-primary",
                      "border-primary",
                      "hover:border-primary-focus"
                    )}
                  </li>
                  <li className="my-2 md:my-0">
                    {navLink(
                      "/datasets",
                      "Datasets",
                      "text-primary",
                      "border-primary",
                      "hover:border-primary-focus"
                    )}
                  </li>
                  {uiAllowed.has(ALLOWED_CREATE_NEW_RELEASE) && (
                    <li className="my-2 md:my-0">
                      {navLink(
                        "/dac",
                        "DAC",
                        "text-primary",
                        "border-primary",
                        "hover:border-primary-focus"
                      )}
                    </li>
                  )}
                  <li className="my-2 md:my-0">
                    {navLink(
                      "/users",
                      "Users",
                      "text-primary",
                      "border-primary",
                      "hover:border-primary-focus"
                    )}
                  </li>
                  <li className="my-2 md:my-0">
                    {navLink(
                      "/audit-events",
                      "Audit Events",
                      "text-primary",
                      "border-primary",
                      "hover:border-primary-focus"
                    )}
                  </li>
                </ul>
              ) : (
                <ul className="list-reset flex-1 items-center px-4 pb-4 md:px-0 lg:flex lg:space-x-12 lg:pb-0">
                  <li className="my-2 md:my-0">
                    {navLink(
                      "/login",
                      "Login",
                      "text-primary",
                      "border-primary",
                      "hover:border-primary-focus"
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
            {loggedInUser && (
              <div className="my-1.5 hidden lg:inline-block">
                <LayoutBaseHeaderUser user={loggedInUser} />
              </div>
            )}
          </div>
        </div>
      </nav>
      {/* NAV END */}

      <div className="container mx-auto w-full grow px-2 pt-10 lg:pt-20">
        <div className="mt-8 mb-8 w-full leading-normal text-gray-800">
          <ErrorBoundary rethrowError={(_: any) => false}>
            <div className="flex flex-col space-y-4">
              <Outlet />
            </div>
          </ErrorBoundary>
        </div>
      </div>

      <div className="bg-white">{<LayoutBaseFooter />}</div>
    </>
  );
};
