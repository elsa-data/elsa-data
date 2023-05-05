import { ReactNode } from "react";

export type TableProps = {
  tableHead: ReactNode;
  tableBody: ReactNode;
};

/**
 * Wrapper around a `table` element.
 */
export const Table = ({ tableHead, tableBody }: TableProps): JSX.Element => {
  return (
    <table className="table table-auto">
      <thead>{tableHead}</thead>
      <tbody>{tableBody}</tbody>
    </table>
  );
};
