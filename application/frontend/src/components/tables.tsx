export {};
/*import { TableOptions, useTable } from "react-table";
import React, { PropsWithChildren } from "react";

type Props = {
  tableOptions: TableOptions<any>;
};

export const BasicTable: React.FC<PropsWithChildren<Props>> = ({
  tableOptions,
  children,
}) => {
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(tableOptions);

  return (
    <table
      {...getTableProps()}
      className="w-full text-sm text-left text-gray-500 light:text-gray-400"
    >
      <thead className="text-xs text-gray-700 uppercase bg-gray-50 light:bg-gray-700 light:text-gray-400">
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th {...column.getHeaderProps()} className="px-6 py-3">
                {column.render("Header")}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row) => {
          prepareRow(row);
          return (
            <tr
              {...row.getRowProps()}
              className="bg-white border-b light:bg-gray-800 light:border-gray-700 hover:bg-gray-50 light:hover:bg-gray-600"
            >
              {row.cells.map((cell) => {
                return (
                  <td {...cell.getCellProps()} className="px-6 py-4">
                    {cell.render("Cell")}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};*/
