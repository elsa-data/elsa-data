import { ReactNode } from "react";

export type TableHeaderProps = {
  key: string;
  children?: ReactNode;
};

/**
 * Wrapper around a `th` element.
 */
export const TableHeader = ({
  key,
  children,
}: TableHeaderProps): JSX.Element => {
  return (
    <th
      key={key}
      className="py-2 font-small text-gray-400 whitespace-nowrap w-40 text-left pl-4"
    >
      {children}
    </th>
  );
};

export type TableRowProps = {
  key: string;
  onClick?: React.MouseEventHandler<HTMLTableRowElement>;
  children: ReactNode | ReactNode[];
};

/**
 * Wrapper around a `tr` element.
 */
export const TableRow = ({
  key,
  onClick,
  children,
}: TableRowProps): JSX.Element => {
  return (
    <tr key={key} onClick={onClick} className="border-b pl-2 pr-2">
      {children}
    </tr>
  );
};

export type TableDataProps = {
  key: string;
  colSpan?: number;
  children: ReactNode;
};

/**
 * Wrapper around a `td` element.
 */
export const TableData = ({
  key,
  colSpan,
  children,
}: TableDataProps): JSX.Element => {
  return (
    <td key={key} colSpan={colSpan} className="border-b pl-2 pr-2">
      {children}
    </td>
  );
};

export type TableProps = {
  tableHead: ReactNode;
  tableBody: ReactNode;
};

/**
 * Wrapper around a `table` element.
 */
export const Table = ({ tableHead, tableBody }: TableProps): JSX.Element => {
  return (
    <table className="w-full text-sm text-left text-gray-500 table-fixed">
      <thead>{tableHead}</thead>
      <tbody>{tableBody}</tbody>
    </table>
  );
};
