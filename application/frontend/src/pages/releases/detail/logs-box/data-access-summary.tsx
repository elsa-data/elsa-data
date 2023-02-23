import React from "react";
import axios from "axios";
import { useQuery } from "react-query";
import { BoxNoPad } from "../../../../components/boxes";
// import { Table } from "../../../../components/tables";
import { convertCamelCaseToTitle } from "../../../../helpers/utils";
import { formatLocalDateTime } from "../../../../helpers/datetime-helper";
import { AuditDataSummaryType } from "@umccr/elsa-types";
import { BiLinkExternal } from "react-icons/bi";
import { EagerErrorBoundary } from "../../../../components/errors";
import { fileSize } from "humanize-plus";
import { Badge, Table } from "flowbite-react";

function DataAccessSummaryBox({ releaseId }: { releaseId: string }) {
  const dataAccessQuery = useQuery(
    ["release-data-access-audit", releaseId],
    async () =>
      await axios
        .get<AuditDataSummaryType[]>(
          `/api/releases/${releaseId}/audit-event/data-access/summary`
        )
        .then((response) => response.data)
  );

  const COLUMN_TO_SHOW = [
    "target",
    "fileUrl",
    "fileSize",
    "dataAccessedInBytes",
    "downloadStatus",
    "lastAccessedTime",
  ] as const;

  const data: AuditDataSummaryType[] | undefined = dataAccessQuery.data;

  const BoxHeader = () => (
    <div className="flex justify-between">
      <div>Data Access Log Summary</div>
      <a
        className="flex	cursor-pointer rounded-md bg-transparent p-1 normal-case hover:bg-slate-200"
        href={`/releases/${releaseId}/audit-event/data-access`}
      >
        <BiLinkExternal />
      </a>
    </div>
  );

  return (
    <BoxNoPad heading={<BoxHeader />}>
      <Table striped>
        <Table.Head>
          {COLUMN_TO_SHOW.map((header) => (
            <Table.HeadCell key={header}>
              {convertCamelCaseToTitle(header)}
            </Table.HeadCell>
          ))}
        </Table.Head>
        <Table.Body>
          {dataAccessQuery.isSuccess &&
            data &&
            data.map((row, rowIdx) => (
              <Table.Row key={`body-row-${rowIdx}`}>
                {COLUMN_TO_SHOW.map((column, colIdx) => (
                  <Table.Cell key={`body-row-${rowIdx}-col-${colIdx}`}>
                    {column === "dataAccessedInBytes" ||
                    column === "fileSize" ? (
                      fileSize(row[column])
                    ) : column === "downloadStatus" ? (
                      <DisplayDownloadStatus status={row[column]} />
                    ) : column === "lastAccessedTime" ? (
                      formatLocalDateTime(row[column])
                    ) : (
                      row[column]
                    )}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
        </Table.Body>
      </Table>
      {dataAccessQuery.isError && (
        <EagerErrorBoundary
          message={"Something went wrong fetching audit logs."}
          error={dataAccessQuery.error}
          styling={"bg-red-100"}
        />
      )}
    </BoxNoPad>
  );
}

export default DataAccessSummaryBox;

/**
 * Helper Component
 */
function DisplayDownloadStatus({ status }: { status: string }) {
  if (status === "multiple-download") {
    return <Badge color="warning">{status}</Badge>;
  } else if (status === "complete") {
    return <Badge color="success">{status}</Badge>;
  }

  return <Badge color="gray">{status}</Badge>;
}
