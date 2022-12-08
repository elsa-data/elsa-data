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
import { EagerErrorBoundary } from "../../../components/errors";
import { handleTotalCountHeaders } from "../../../helpers/paging-helper";

type Props = {
  // the (max) number of users shown on any single page
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

          handleTotalCountHeaders(response, setCurrentTotal);

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
    <BoxNoPad
      heading="Users (not you)"
      errorMessage={"Something went wrong fetching users."}
    >
      <div className="flex flex-col">
        <BoxPaginator
          currentPage={currentPage}
          setPage={(n) => setCurrentPage(n)}
          rowCount={currentTotal - 1}
          rowsPerPage={pageSize}
          rowWord="other users"
        />
        <table className="w-full text-sm text-left text-gray-500 table-fixed">
          <tbody>{dataQuery.isSuccess && createRows(dataQuery.data)}</tbody>
        </table>
        {dataQuery.isError && (
          <EagerErrorBoundary
            message={"Something went wrong fetching users."}
            error={dataQuery.error}
            styling={"bg-red-100"}
          />
        )}
      </div>
    </BoxNoPad>
  );
};
