import React from "react";
import { LayoutBase } from "../../../../layouts/layout-base";
import DataAccessLogsBox from "./data-access-logs";

type Props = {};

function DataAccessPage({}: Props) {
  return (
    <LayoutBase>
      <DataAccessLogsBox />
    </LayoutBase>
  );
}

export default DataAccessPage;
