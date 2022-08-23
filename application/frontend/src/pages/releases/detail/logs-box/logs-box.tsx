import React, { ReactNode, useState } from "react";
import { AuditEntryType } from "@umccr/elsa-types";
import axios from "axios";
import { useQuery, useQueryClient } from "react-query";
import classNames from "classnames";
import { BoxNoPad } from "../../../../components/boxes";
import { BoxPaginator } from "../../../../components/box-paginator";
import { format } from "date-fns-tz";
import * as duration from "duration-fns";
import { parseISO } from "date-fns";

type Props = {
  releaseId: string;

  // the (max) number of log items shown on any single page
  pageSize: number;
};

export const LogsBox: React.FC<Props> = ({ releaseId, pageSize }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  // very briefly whilst the first page is downloaded we estimate that we have only one entry
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const dataQuery = useQuery(
    ["releases-audit-log", currentPage, releaseId],
    async () => {
      return await axios
        .get<AuditEntryType[]>(
          `/api/releases/${releaseId}/audit-log?page=${currentPage}`
        )
        .then((response) => {
          // as we page - the backend relays to us an accurate total count so we then use that
          // in the UI
          const newTotal = parseInt(response.headers["elsa-total-count"]);

          if (isFinite(newTotal)) setCurrentTotal(newTotal);

          return response.data;
        });
    },
    { keepPreviousData: true }
  );

  const baseColumnClasses = "py-2 font-small text-gray-400 whitespace-nowrap";

  const createRows = (data: AuditEntryType[]) => {
    let viewLastDay = "";

    return data.map((row, rowIndex) => {
      const when = parseISO(row.when as string);

      // TODO: get timezone from somewhere in config

      const localDay = format(when, "d/M/yyyy", {
        timeZone: "Australia/Melbourne",
      });
      const localTime = format(when, "HH:mm:ss", {
        timeZone: "Australia/Melbourne",
      });

      let showDay = false;

      if (localDay != viewLastDay) {
        showDay = true;
        viewLastDay = localDay;
      }

      let showDuration = false;
      let localDuration = "";

      if (row.duration) {
        const parsedDuration = duration.parse(row.duration);

        if (
          parsedDuration.days > 0 ||
          parsedDuration.weeks > 0 ||
          parsedDuration.months > 0 ||
          parsedDuration.years
        )
          // not at all expecting this to happen - if so - just show the entire duration string
          localDuration = `for ${row.duration}`;
        else if (parsedDuration.hours > 0)
          // even hr long activities are unlikely - but we can show that
          localDuration = `for ${parsedDuration.hours} hr(s)`;
        else if (parsedDuration.minutes > 0)
          localDuration = `for ${parsedDuration.minutes} min(s)`;
        else if (parsedDuration.seconds > 0)
          localDuration = `for ${parsedDuration.seconds} sec(s)`;
        else localDuration = "";

        showDuration = true;
      }

      return (
        <tr key={rowIndex} className="border-b pl-2 pr-2">
          <td
            className={classNames(
              baseColumnClasses,
              "w-40",
              "text-left",
              "pl-4"
            )}
          >
            {showDay && <p className="font-bold">{viewLastDay}</p>}
            <p>{localTime}</p>
            {showDuration && <p className="text-xs">{localDuration}</p>}
          </td>
          <td className={classNames(baseColumnClasses, "text-left", "w-auto")}>
            {row.actionDescription}
          </td>
          <td
            className={classNames(
              baseColumnClasses,
              "text-right",
              "w-40",
              "pr-4"
            )}
          >
            {row.whoDisplay}
          </td>
        </tr>
      );
    });
  };

  return (
    <BoxNoPad heading="Audit Logs">
      <div className="flex flex-col">
        <BoxPaginator
          currentPage={currentPage}
          setPage={(n) => setCurrentPage(n)}
          rowCount={currentTotal}
          rowsPerPage={pageSize}
          rowWord="log entries"
        />
        <table className="w-full text-sm text-left text-gray-500 table-fixed">
          <tbody>{dataQuery.isSuccess && createRows(dataQuery.data)}</tbody>
        </table>
      </div>
    </BoxNoPad>
  );
};
