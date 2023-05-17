import React, { PropsWithChildren } from "react";
import { Tab } from "@headlessui/react";
import classNames from "classnames";

type VerticalTabsProps = {
  tabHeadings: string[];
};

/**
 * Vertical tabs is our base display component where we want to share a variable number
 * of functionality areas (i.e. a bunch of plugins each with a corresponding interface)
 *
 * @param tabs a list of tab headings, 1:1 corresponding to children elements
 * @param children the children elements, 1:1 for each tab heading
 * @constructor
 */
export const VerticalTabs: React.FC<PropsWithChildren<VerticalTabsProps>> = ({
  tabHeadings,
  children,
}) => {
  return (
    <div
      className={classNames(
        "grid grid-cols-5",
        "min-h-[200px]" // we want to assert a minimum height so that the whole tab group doesn't resize up and down as we tab through (small) content
      )}
    >
      <Tab.Group vertical={true}>
        <Tab.List
          className={classNames(
            "flex flex-col justify-start", // vertical flex column but everything justified start (as we have a overall min height we *don't* want to grow into)
            "col-span-1", // assert a column span for the headers - here 1/5 of the overall grid
            "space-y-4" // with some spacing between tab headers
          )}
        >
          {tabHeadings.map((t, idx) => (
            <Tab
              key={idx}
              as="a"
              className={({ selected }) =>
                classNames(
                  "cursor-pointer px-4 py-2 text-sm uppercase outline-0 ring-0",
                  "translate-x-2 transform border-l-2 font-bold",
                  {
                    "border-secondary": selected,
                    "border-slate-200 transition duration-200 ease-in-out hover:border-secondary-focus":
                      !selected,
                  }
                )
              }
            >
              {t}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="col-span-4">
          {React.Children.map(children, (child) => (
            <Tab.Panel>{child}</Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};
