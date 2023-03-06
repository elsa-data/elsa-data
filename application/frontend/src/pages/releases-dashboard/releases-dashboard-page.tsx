import React, { useState } from "react";
import { useQuery } from "react-query";
import axios from "axios";
import { Box } from "../../components/boxes";
import { ReleaseSummaryType } from "@umccr/elsa-types";
import { REACT_QUERY_RELEASE_KEYS } from "../releases/detail/queries";
import { EagerErrorBoundary } from "../../components/errors";
import { IsLoadingDiv } from "../../components/is-loading-div";
import { useNavigate } from "react-router-dom";
import { BoxPaginator } from "../../components/box-paginator";
import { handleTotalCountHeaders } from "../../helpers/paging-helper";
import { usePageSizer } from "../../hooks/page-sizer";
import classNames from "classnames";

export const ReleasesDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const pageSize = usePageSizer();
  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);

  // very briefly whilst the first page is downloaded we estimate that we have only one entry
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const query = useQuery(
    REACT_QUERY_RELEASE_KEYS.all,
    async () => {
      return await axios
        .get<ReleaseSummaryType[]>(`/api/releases`)
        .then((response) => {
          handleTotalCountHeaders(response, setCurrentTotal);
          return response.data;
        });
    },
    {}
  );

  return (
    <div className="mt-2 flex flex-grow flex-row flex-wrap">
      <Box
        heading="Releases"
        errorMessage={"Something went wrong fetching releases."}
      >
        {query.isLoading && <IsLoadingDiv />}
        {query.isSuccess && query.data && (
          <table className="table w-full">
            <thead>
              <tr>
                <th scope="col">Title / Identifier</th>
                <th scope="col">Source DAC</th>
                <th scope="col">Role (in release)</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((r, idx) => (
                <tr key={idx}>
                  <td scope="row">
                    <div>
                      <div className="font-bold">{r.applicationDacTitle}</div>
                      <div className="font-mono text-sm opacity-50">
                        {r.releaseIdentifier}
                      </div>
                    </div>
                  </td>
                  <td scope="row">
                    <span className="text-xs">
                      {r.applicationDacIdentifierSystem}
                    </span>
                    <br />
                    {r.applicationDacIdentifierValue}
                  </td>
                  <td>{r.roleInRelease}</td>
                  <td className="text-right">
                    <button
                      className={classNames("btn-table-action-navigate")}
                      onClick={async () => {
                        navigate(`${r.id}/detail`);
                      }}
                    >
                      view
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {query.isError && (
          <EagerErrorBoundary
            message={"Something went wrong fetching releases."}
            error={query.error}
            styling={"bg-red-100"}
          />
        )}
        <BoxPaginator
          currentPage={currentPage}
          setPage={setCurrentPage}
          rowCount={currentTotal}
          rowsPerPage={pageSize}
          rowWord="releases"
        />
      </Box>
    </div>
  );
};
