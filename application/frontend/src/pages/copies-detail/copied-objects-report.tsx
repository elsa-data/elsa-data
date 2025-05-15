import React, { useState } from "react";
import classNames from "classnames";
import { BoxPaginator } from "../../components/box-paginator";
import { IsLoadingDiv } from "../../components/is-loading-div";
import { Table } from "../../components/tables";
import { usePageSizer } from "../../hooks/page-sizer";
import { CopySummaryEntry } from "../../../../backend/src/business/services/copy-service.ts";
import { fileSize } from "humanize-plus";
import { useTRPC } from "../../helpers/trpc-modern.ts";

type CopiedObjectTableProps = {
  copyExecutionArn: string;
};

/**
 * A table with pagination showing the results of object copies.
 *
 * @constructor
 */
export const CopiedObjectsReport: React.FC<CopiedObjectTableProps> = (
  props,
) => {
  const pageSize = usePageSizer();
  const trpc = useTRPC();

  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);

  const copySummaryHeaderOptions = trpc.copyService;
  const copySummaryHeaderQuery =
    trpcOld.copyService.getCopiedReportHeader.useQuery({
      stepsExecutionArn: props.copyExecutionArn,
    });

  const copySummaryRowsQuery = trpcOld.copyService.getCopiedReportRows.useQuery(
    {
      stepsExecutionArn: props.copyExecutionArn,
      page: currentPage,
    },
  );

  const baseColumnClasses = "py-4 font-medium text-gray-900 whitespace-nowrap";

  const createHeaders = () => {
    return (
      <tr>
        <th scope="col" className="table-cell">
          Destination
        </th>
        <th scope="col" className="table-cell">
          Bytes
        </th>
        <th scope="col" className="table-cell">
          Copy Mode
        </th>
        <th scope="col" className="table-cell text-right">
          Checksums
        </th>
      </tr>
    );
  };

  //             {formatLocalDateTime(row.lastLogin as string | undefined)}
  const createRows = (data: CopySummaryEntry[]) => {
    return data.map((row, rowIndex) => {
      return (
        <tr key={rowIndex} className="border-b pl-2 pr-2">
          <td
            className={classNames(
              baseColumnClasses,
              "text-left text-xs font-mono",
            )}
          >
            {row.destination}
          </td>

          <td
            className={classNames(
              baseColumnClasses,
              "text-left",
              "pr-4",
              "font-normal",
            )}
          >
            {row.elapsed_seconds > 0 &&
              (
                row.bytes_transferred /
                row.elapsed_seconds /
                1024 /
                1024
              ).toFixed(2)}{" "}
            MiB/s
          </td>

          <td
            className={classNames(
              baseColumnClasses,
              "text-left",
              "pl-4",
              "font-normal",
            )}
          >
            {row.copy_mode}
          </td>

          <td
            className={classNames(
              baseColumnClasses,
              "text-left",
              "pl-4",
              "font-normal",
            )}
          >
            {row.reason?.kind} {row.reason?.value}
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="flex flex-col">
      <h2 className="my-2 font-medium">Objects Copied</h2>

      {copySummaryHeaderQuery.isError && (
        <pre>{JSON.stringify(copySummaryHeaderQuery.error, null, 2)}</pre>
      )}

      {copySummaryHeaderQuery.isSuccess && (
        <p className="prose mb-4 text-sm text-gray-500">
          <p>
            Time taken = {copySummaryHeaderQuery.data.timeTakenSeconds} seconds
          </p>
          <p>
            Amount transferred ={" "}
            {fileSize(copySummaryHeaderQuery.data.totalBytesTransferred)}
          </p>
          <p>
            Overall rate ={" "}
            {(
              copySummaryHeaderQuery.data.totalBytesTransferred /
              copySummaryHeaderQuery.data.timeTakenSeconds /
              1024 /
              1024 /
              1024
            ).toFixed(2)}{" "}
            GiB/s
          </p>
        </p>
      )}

      {/*{copySummaryRowsQuery.isError && (
        <EagerErrorBoundary error={copySummaryRowsQuery.error} />
      )}*/}

      {copySummaryRowsQuery.isSuccess && (
        <>
          <Table
            tableHead={createHeaders()}
            tableBody={createRows(copySummaryRowsQuery?.data?.data ?? [])}
          />
          <BoxPaginator
            currentPage={currentPage}
            setPage={(n) => setCurrentPage(n)}
            rowCount={copySummaryRowsQuery?.data?.total ?? 0}
            rowsPerPage={pageSize}
            rowWord="objects copied"
          />
        </>
      )}

      {copySummaryRowsQuery.isLoading && <IsLoadingDiv />}
    </div>
  );
};
