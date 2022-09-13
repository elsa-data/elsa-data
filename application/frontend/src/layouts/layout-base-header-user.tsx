import { Menu, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import { LoggedInUser } from "../providers/logged-in-user-provider";
import classNames from "classnames";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

type Props = {
  user: LoggedInUser;
};

export const LayoutBaseHeaderUser: React.FC<Props> = ({ user }) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button
          className={classNames(
            "inline-flex w-full justify-center",
            "rounded-md border border-gray-300",
            "bg-white px-2 py-1",
            "text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100"
          )}
        >
          {user.displayName}
          {user.displayEmail && (
            <span className="font-mono ml-2">{user.displayEmail}</span>
          )}
          <ChevronDownIcon className="-mr-1 ml-2 h-3 w-3" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {/*<Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={classNames(
                    active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                    "block px-4 py-2 text-sm"
                  )}
                >
                  Account settings
                </a>
              )}
            </Menu.Item> */}
            <form method="POST" action="/auth/logout">
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="submit"
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "block w-full px-4 py-2 text-left text-sm"
                    )}
                  >
                    Log Out
                  </button>
                )}
              </Menu.Item>
            </form>
            <form method="POST" action="/auth/logout-completely">
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="submit"
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "block w-full px-4 py-2 text-left text-sm"
                    )}
                  >
                    Log Out (Complete)
                  </button>
                )}
              </Menu.Item>
            </form>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
