import React from "react";
import { AuditDataAccessType } from "@umccr/elsa-types";
import { useQuery } from "react-query";
import { BoxNoPad } from "../../../../components/boxes";
import { Table } from "../../../../components/tables";
import { ToolTip } from "../../../../components/tooltip";
import { formatLocalDateTime } from "../../../../helpers/datetime-helper";
import { getStringReadableBytes } from "../../../../helpers/utils";
import { categoryToDescription, outcomeIsSuccess } from "./logs-box";
import { useParams } from "react-router-dom";
import axios from "axios";
import { isEmpty, isNil } from "lodash";

function DataAccessLogsBox() {
  const { releaseId, objectId } = useParams<{
    releaseId: string;
    objectId: string;
  }>();

  const dataAccessQuery = useQuery(
    ["release-data-access-audit", releaseId, objectId],
    async () =>
      await axios
        .get<AuditDataAccessType[]>(
          `/api/releases/${releaseId}/audit-log/${objectId}/data-access`
        )
        .then((response) => response.data)
  );

  // Move to types
  const COLUMN_TO_SHOW = [
    { key: "fileUrl", value: "File URL" },
    { key: "whoDisplayName", value: "IP Address" },
    { key: "actionCategory", value: "Category" },
    { key: "occurredDateTime", value: "Occurred Date Time" },
    { key: "egressBytes", value: "Number of Bytes Accessed" },
  ];

  const data: AuditDataAccessType[] | undefined = dataAccessQuery.data;
  if ((isNil(data) || isEmpty(data)) && dataAccessQuery.isSuccess) return <></>;
  return (
    <BoxNoPad heading="Data Access Log Summary">
      <Table
        tableHead={
          <tr className="text-sm text-gray-500 whitespace-nowrap border-b bg-slate-50 border-slate-700">
            {COLUMN_TO_SHOW.map((header, idx) => (
              <th
                key={idx}
                className="p-4 text-sm text-gray-600 whitespace-nowrap border-b hover:rounded-lg"
              >
                <div className="flex flex-nowrap space-x-1">{header.value}</div>
              </th>
            ))}
          </tr>
        }
        tableBody={
          dataAccessQuery.isSuccess &&
          data &&
          data.map((row, idx) => (
            <>
              <tr
                key={idx}
                className="group text-sm text-gray-500 whitespace-nowrap border-b odd:bg-white even:bg-slate-50 border-slate-700 hover:bg-slate-100 hover:rounded-lg"
              >
                {COLUMN_TO_SHOW.map((col, idx) => {
                  const objKey = col.key;
                  return (
                    <td
                      className="p-4 text-sm text-gray-500 whitespace-nowrap border-b"
                      key={idx}
                    >
                      {objKey === "egressBytes" ? (
                        getStringReadableBytes(row[objKey])
                      ) : objKey === "occurredDateTime" ? (
                        formatLocalDateTime(row[objKey])
                      ) : objKey === "actionCategory" ? (
                        <ToolTip
                          trigger={
                            <div className="flex items-center w-8 h-8">
                              {row[objKey]}
                            </div>
                          }
                          description={categoryToDescription(row[objKey])}
                        />
                      ) : objKey === "whoDisplayName" ||
                        objKey === "fileUrl" ? (
                        row[objKey]
                      ) : (
                        ""
                      )}
                    </td>
                  );
                })}
              </tr>
            </>
          ))
        }
      />
    </BoxNoPad>
  );
}

export default DataAccessLogsBox;
