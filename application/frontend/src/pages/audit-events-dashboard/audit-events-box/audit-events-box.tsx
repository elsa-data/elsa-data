import { BoxNoPad } from "../../../components/boxes";
import { Table } from "../../../components/tables";
import React, { useState } from "react";
import { BoxPaginator } from "../../../components/box-paginator";

export type AuditEventsBoxProps = {
  pageSize: number;
};

/**
 * The main logs box component.
 */
export const AuditEventsBox = ({
  pageSize,
}: AuditEventsBoxProps): JSX.Element => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTotal, setCurrentTotal] = useState(1);

  return (
    <BoxNoPad
      heading="Audit Events"
      errorMessage={"Something went wrong fetching audit event entries."}
    >
      <div className="flex flex-col">
        <Table tableHead={<></>} tableBody={<></>} />
        <BoxPaginator
          currentPage={currentPage}
          setPage={(n) => {
            setCurrentPage(n);
          }}
          rowCount={currentTotal}
          rowsPerPage={pageSize}
          rowWord="Audit Event Entries"
        />
      </div>
    </BoxNoPad>
  );
};
