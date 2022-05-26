import React, { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

type Props = {};

// https://github.com/tailwindtoolbox/Admin-Template-Day

export const LayoutBase: React.FC<PropsWithChildren<Props>> = ({
  children,
}) => {
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
      <li className="mr-6 my-2 md:my-0">
        <NavLink
          to={to}
          className={({ isActive }) => (isActive ? whenActive : whenInactive)}
        >
          <span className="pb-1 md:pb-0 text-sm">{label}</span>
        </NavLink>
      </li>
    );
  };

  return (
    <>
      {/* NAV START */}
      <nav id="header" className="bg-white fixed w-full z-10 top-0 shadow">
        <div className="w-full container mx-auto flex flex-wrap items-center mt-0 pt-3 pb-3 md:pb-0">
          <div className="w-1/2 pl-2 md:pl-0">
            <a
              className="text-gray-900 text-base xl:text-xl no-underline hover:no-underline font-bold"
              href="/"
            >
              Elsa Data
            </a>
          </div>
          <div className="w-1/2 pr-0">
            <div className="flex relative inline-block float-right">
              <div className="relative text-sm">
                <button
                  id="userButton"
                  className="flex items-center focus:outline-none mr-3"
                >
                  {" "}
                  <span className="hidden md:inline-block">Hi, User </span>
                </button>
                <div
                  id="userMenu"
                  className="bg-white rounded shadow-md mt-2 absolute mt-12 top-0 right-0 min-w-full overflow-auto z-30 invisible"
                >
                  <ul className="list-reset">
                    <li>
                      <a
                        href="#"
                        className="px-4 py-2 block text-gray-900 hover:bg-gray-400 no-underline hover:no-underline"
                      >
                        My account
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="px-4 py-2 block text-gray-900 hover:bg-gray-400 no-underline hover:no-underline"
                      >
                        Notifications
                      </a>
                    </li>
                    <li>
                      <hr className="border-t mx-2 border-gray-400" />
                    </li>
                    <li>
                      <a
                        href="#"
                        className="px-4 py-2 block text-gray-900 hover:bg-gray-400 no-underline hover:no-underline"
                      >
                        Logout
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="block lg:hidden pr-4">
                <button
                  id="nav-toggle"
                  className="flex items-center px-3 py-2 border rounded text-gray-500 border-gray-600 hover:text-gray-900 hover:border-teal-500 appearance-none focus:outline-none"
                >
                  <svg
                    className="fill-current h-3 w-3"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Menu</title>
                    <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div
            className="w-full flex-grow lg:flex lg:items-center lg:w-auto hidden lg:block mt-2 lg:mt-0 bg-white z-20"
            id="nav-content"
          >
            <ul className="list-reset lg:flex flex-1 items-center px-4 md:px-0">
              <li className="mr-6 my-2 md:my-0">
                {navLink(
                  "/",
                  "Home",
                  "text-orange-600",
                  "border-orange-600",
                  "hover:border-orange-600"
                )}
              </li>
              <li className="mr-6 my-2 md:my-0">
                {navLink(
                  "/releases",
                  "Releases",
                  "text-purple-500",
                  "border-purple-500",
                  "hover:border-purple-500"
                )}
              </li>
              <li className="mr-6 my-2 md:my-0">
                {navLink(
                  "/datasets",
                  "Datasets",
                  "text-green-500",
                  "border-green-500",
                  "hover:border-green-500"
                )}
              </li>
            </ul>

            <div className="relative pull-right pl-4 pr-4 md:pr-0">
              <input
                type="search"
                placeholder="Search"
                className="w-full bg-gray-100 text-sm text-gray-800 transition border focus:outline-none focus:border-gray-700 rounded py-1 px-2 pl-10 appearance-none leading-normal"
              />
            </div>
          </div>
        </div>
      </nav>
      {/* NAV END */}

      <div className="container w-full mx-auto pt-20 grow">
        <div className="w-full px-4 md:px-0 md:mt-8 mb-16 text-gray-800 leading-normal">
          {children}
        </div>
      </div>

      {/* FOOTER START  */}
      <footer className="bg-white border-t border-gray-400 shadow">
        <div className="container max-w-md mx-auto flex py-8">
          <div className="w-full mx-auto flex flex-wrap">
            <div className="flex w-full md:w-1/2 ">
              <div className="px-8">
                <h3 className="font-bold font-bold text-gray-900">About</h3>
                <p className="py-4 text-gray-600 text-sm">
                  A data release coordinator
                </p>
              </div>
            </div>

            <div className="flex w-full md:w-1/2">
              <div className="px-8">
                <h3 className="font-bold font-bold text-gray-900">Social</h3>
                <ul className="list-reset items-center text-sm pt-3">
                  <li>
                    <a
                      className="inline-block text-gray-600 no-underline hover:text-gray-900 hover:underline py-1"
                      href="https://www.ga4gh.org"
                    >
                      GA4GH
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
      {/* FOOTER END */}
    </>
  );
};
