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
    <table className="h-full w-full table-auto border-collapse overflow-auto py-4 text-left text-sm text-gray-800">
      <thead>{tableHead}</thead>
      <tbody>{tableBody}</tbody>
    </table>
  );
};
