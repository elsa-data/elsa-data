import React, { PropsWithChildren } from "react";
import classNames from "classnames";
import { MenuItem as HeadlessUIMenuItem } from "@headlessui/react";

export const MenuItem: React.FC<PropsWithChildren<{}>> = ({
  children,
}): JSX.Element => {
  return (
    <HeadlessUIMenuItem>
      {({ focus }) => (
        <div
          className={classNames(
            focus ? "bg-gray-100 text-gray-900" : "text-gray-700",
            "flex h-9 grow text-left text-sm ",
          )}
        >
          {children}
        </div>
      )}
    </HeadlessUIMenuItem>
  );
};
