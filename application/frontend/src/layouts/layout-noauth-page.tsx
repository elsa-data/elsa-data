import React, { PropsWithChildren } from "react";
import { LayoutBase } from "./layout-base";

export const LayoutNoAuthPage: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  return <LayoutBase>{children}</LayoutBase>;
};
