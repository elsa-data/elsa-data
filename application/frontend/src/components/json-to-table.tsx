import React from "react";

type Props = {
  jsonObj: Record<string, any>;
};

function JSONToTable(props: Props) {
  const { jsonObj } = props;

  return (
    <table className="table-auto w-full">
      <tbody>
        {Object.keys(jsonObj).map((key) => {
          const val = jsonObj[key];
          return (
            <tr key={key} className="text-base">
              <td className="mr-4">{key}</td>
              <td>{val}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default JSONToTable;
