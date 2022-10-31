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
    <table className="table-auto border-collapse w-full h-full text-sm text-left text-gray-800 py-4">
      <thead>{tableHead}</thead>
      <tbody>{tableBody}</tbody>
    </table>
  );
};
