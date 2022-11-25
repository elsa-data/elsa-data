import React, { useState } from "react";
import axios from "axios";
import { useQuery } from "react-query";
import classNames from "classnames";
import { BoxNoPad } from "../../../components/boxes";
import { BoxPaginator } from "../../../components/box-paginator";
import { UserSummaryType } from "@umccr/elsa-types/schemas-users";
import { useCookies } from "react-cookie";
import {
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";
import { formatLocalDateTime } from "../../../helpers/datetime-helper";
import {ErrorBoundary} from "../../../components/error-display";

type Props = {
  // the (max) number of case items shown on any single page
  pageSize: number;
};

export const OthersBox: React.FC<Props> = ({ pageSize }) => {
  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);

  // very briefly whilst the first page is downloaded we estimate that we have only one entry
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const [cookies] = useCookies<any>([
    USER_SUBJECT_COOKIE_NAME,
    USER_NAME_COOKIE_NAME,
  ]);

  const dataQuery = useQuery(
    ["users", currentPage],
    async () => {
      return await axios
        .get<UserSummaryType[]>(`/api/users?page=${currentPage}`)
        .then((response) => {
          const usersWithoutMe = response.data.filter(
            (u) => u.subjectIdentifier !== cookies[USER_SUBJECT_COOKIE_NAME]
          );

          // as we page - the backend relays to us an accurate total count so we then use that in the UI
          const newTotal = parseInt(response.headers["elsa-total-count"]);

          // use the value if it appears sensible (we subtract one because we are taking ourselves out of the user list)
          if (isFinite(newTotal)) setCurrentTotal(newTotal - 1);

          return usersWithoutMe;
        });
    },
    { keepPreviousData: true }
  );

  const baseColumnClasses = "py-4 font-medium text-gray-900 whitespace-nowrap";

  const createRows = (data: UserSummaryType[]) => {
    return data.map((row, rowIndex) => {
      return (
        <tr key={rowIndex} className="border-b pl-2 pr-2">
          <td
            className={classNames(
              baseColumnClasses,
              "text-left",
              "pl-4",
              "w-auto"
            )}
          >
            {row.subjectIdentifier}
          </td>
          <td className={classNames(baseColumnClasses, "text-left", "w-auto")}>
            {row.displayName}
          </td>
          <td className={classNames(baseColumnClasses, "text-left", "w-auto")}>
            {row.allowedChangeReleaseDataOwner} {row.allowedCreateRelease}{" "}
            {row.allowedImportDataset}
          </td>
          <td
            className={classNames(
              baseColumnClasses,
              "w-40",
              "text-right",
              "pr-4"
            )}
          >
            {formatLocalDateTime(row.lastLogin as string | undefined)}
          </td>
        </tr>
      );
    });
  };

  return (
    <BoxNoPad heading="Users (not you)">
      <div className="flex flex-col">
        <BoxPaginator
          currentPage={currentPage}
          setPage={(n) => setCurrentPage(n)}
          rowCount={currentTotal}
          rowsPerPage={pageSize}
          rowWord="other users"
        />
        <table className="w-full text-sm text-left text-gray-500 table-fixed">
          <tbody>{dataQuery.isSuccess && createRows(dataQuery.data)}</tbody>
        </table>
        {dataQuery.isError && <ErrorBoundary error={dataQuery.error}></ErrorBoundary>}
      </div>
    </BoxNoPad>
  );
};
