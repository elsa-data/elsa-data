import React, { useState } from "react";
import { useQuery } from "react-query";
import axios from "axios";
import { Box } from "../../components/boxes";
import { ReleaseSummaryType } from "@umccr/elsa-types";
import { REACT_QUERY_RELEASE_KEYS } from "../releases/queries";
import { EagerErrorBoundary } from "../../components/errors";
import { IsLoadingDiv } from "../../components/is-loading-div";
import { useNavigate } from "react-router-dom";
import { BoxPaginator } from "../../components/box-paginator";
import { handleTotalCountHeaders } from "../../helpers/paging-helper";
import { usePageSizer } from "../../hooks/page-sizer";
import classNames from "classnames";
import { TableFooterPaginator } from "../../components/table-footer-paginator";

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
    <>
      <Box
        heading="Releases"
        errorMessage={"Something went wrong fetching releases."}
      >
        {query.isLoading && <IsLoadingDiv />}
        {query.isSuccess && query.data && (
          <table className="table w-full table-auto">
            <thead>
              <tr>
                <th scope="col">Title / Identifier</th>
                <th scope="col" className="hidden lg:table-cell">
                  Source DAC
                </th>
                <th scope="col" className="hidden lg:table-cell">
                  Role (in release)
                </th>
                <th scope="col" className="hidden lg:table-cell">
                  Status
                </th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((r, idx) => (
                <tr key={idx}>
                  {/* titles can be arbitrary length so we need to enable word wrapping */}
                  <td className="whitespace-normal break-words">
                    <div>
                      <div className="font-bold">{r.applicationDacTitle}</div>
                      <div className="flex flex-row space-x-2 text-sm">
                        <span className="font-mono opacity-50">
                          {r.releaseIdentifier}
                        </span>
                        {/* a replication of the details in other columns - but we use Tailwind
                              classes to make them disappear on small screens */}
                        <span className="opacity-50 lg:hidden">
                          as {r.roleInRelease}
                        </span>
                        {r.isActivated && (
                          <span className="badge-success badge lg:hidden">
                            activated
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell">
                    <div>
                      <div className="break-all text-xs">
                        {r.applicationDacIdentifierSystem}
                      </div>
                      <div className="break-all font-mono text-xs opacity-50">
                        {r.applicationDacIdentifierValue}
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell">{r.roleInRelease}</td>
                  <td className="hidden lg:table-cell">
                    {r.isActivated && (
                      <span className="badge-success badge">activated</span>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      className={classNames("btn-table-action-navigate")}
                      onClick={async () => {
                        navigate(`${r.releaseIdentifier}/detail`);
                      }}
                    >
                      view
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* <tfoot>
              <TableFooterPaginator
                currentPage={currentPage}
                setPage={setCurrentPage}
                rowCount={currentTotal}
                itemsPerPage={2}
                rowWord="releases"
              />
            </tfoot> */}
          </table>
        )}
        {query.isError && (
          <EagerErrorBoundary
            message={"Something went wrong fetching releases."}
            error={query.error}
            styling={"bg-red-100"}
          />
        )}
      </Box>
    </>
  );
};
