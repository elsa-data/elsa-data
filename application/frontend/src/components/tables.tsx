import { ReactNode } from "react";

export type TableProps = {
  additionalTableClassName?: string;
  tableHead?: ReactNode;
  tableBody?: ReactNode;
};

/**
 * Wrapper around a `table` element.
 */
export const Table = ({
  additionalTableClassName,
  tableHead,
  tableBody,
}: TableProps): JSX.Element => {
  return (
    <div className={`overflow-x-auto`}>
      <table
        className={`table w-full table-auto whitespace-normal break-all	${
          additionalTableClassName ?? ""
        }`}
      >
        {tableHead && <thead>{tableHead}</thead>}
        {tableBody && <tbody>{tableBody}</tbody>}
      </table>
    </div>
  );
};
