import React, { PropsWithChildren } from "react";
import { Tab } from "@headlessui/react";
import classNames from "classnames";

type VerticalTabsProps = {
  tabs: string[];
};

export const VerticalTabs: React.FC<PropsWithChildren<VerticalTabsProps>> = ({
  tabs,
  children,
}) => {
  return (
    <Tab.Group vertical={true}>
      <Tab.List className="flex-none w-1/5 flex-col border-solid border-r-2 border-gray-500 pr-2 mr-6 min-h-[200px]">
        {tabs.map((t) => (
          <Tab
            className={({ selected }) =>
              classNames(
                "w-full block font-medium text-xs leading-tight uppercase border-x-0 border-t-0 border-b-2 border-transparent px-6 py-3 my-2 hover:border-green-200 hover:bg-gray-100",
                selected ? "border-green-300" : ""
              )
            }
          >
            {t}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="grow">
        {React.Children.map(children, (child) => (
          <Tab.Panel>{child}</Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
};
