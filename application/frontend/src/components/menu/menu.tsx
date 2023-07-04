import React, { Fragment, PropsWithChildren, ReactNode } from "react";
import { Menu as HeadlessUIMenu, Transition } from "@headlessui/react";
import classNames from "classnames";
import { BiChevronDown } from "react-icons/bi";

type MenuProps = {
  heading: ReactNode;
};

export const Menu: React.FC<PropsWithChildren<MenuProps>> = ({
  heading,
  children,
}): JSX.Element => {
  return (
    <HeadlessUIMenu as="div" className="relative inline-block text-left">
      <HeadlessUIMenu.Button
        className={classNames(
          "inline-flex w-full justify-center",
          "rounded-md border border-gray-300",
          "bg-white px-2 py-1",
          "text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100"
        )}
      >
        {heading}
        <BiChevronDown className="-mr-1 ml-2 h-3 w-3" aria-hidden="true" />
      </HeadlessUIMenu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <HeadlessUIMenu.Items
          className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg
      ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <div className="py-1">{children}</div>
        </HeadlessUIMenu.Items>
      </Transition>
    </HeadlessUIMenu>
  );
};
