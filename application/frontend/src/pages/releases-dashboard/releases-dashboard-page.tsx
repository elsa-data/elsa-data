import React, { useState } from "react";
import { Box } from "../../components/boxes";
import { EagerErrorBoundary } from "../../components/errors";
import { IsLoadingDiv } from "../../components/is-loading-div";
import { useNavigate } from "react-router-dom";
import { BoxPaginator } from "../../components/box-paginator";
import { usePageSizer } from "../../hooks/page-sizer";
import classNames from "classnames";
import { formatLocalDateTime } from "../../helpers/datetime-helper";
import { trpc } from "../../helpers/trpc";

export const ReleasesDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // our internal state for which page we are on
  const pageSize = usePageSizer();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentTotal, setCurrentTotal] = useState<number>(1);

  const releaseQuery = trpc.releaseRouter.getAllRelease.useQuery(
    {
      page: currentPage,
    },
    {
      keepPreviousData: true,
      onSuccess: (res) => {
        setCurrentTotal(res.total);
      },
    }
  );
  const queryData = releaseQuery.data?.data;

  return (
    <>
      <Box
        heading="Releases"
        errorMessage={"Something went wrong fetching releases."}
      >
        {releaseQuery.isLoading && <IsLoadingDiv />}
        {releaseQuery.isSuccess && queryData?.length === 0 && (
          <>
            <p className="prose">
              This page normally shows any releases that you are involved in.
              Currently the system thinks you are not involved in any releases -
              if this is wrong, please contact the project manager or CI/Manager
              of your project and ask them to check that you are listed as a
              participant of a release.
            </p>
            <p className="prose">
              Until this is corrected there is very little functionality enabled
              for you.
            </p>
          </>
        )}
        {releaseQuery.isSuccess && queryData && queryData?.length > 0 && (
          <>
            <table className="table table-auto">
              <thead>
                <tr>
                  <th scope="col">Title / Identifier</th>
                  <th scope="col" className="hidden xl:table-cell">
                    Source DAC
                  </th>
                  <th scope="col" className="hidden xl:table-cell">
                    Role (in release)
                  </th>
                  <th scope="col" className="hidden xl:table-cell">
                    Last Modified / Status
                  </th>
                  <th scope="col">{/* action links */}</th>
                </tr>
              </thead>
              <tbody>
                {queryData.map((r, idx) => {
                  const jobBadgeContent = r.isRunningJobBadge
                    ? `${r.isRunningJobBadge} ${r.isRunningJobPercentDone}%`
                    : undefined;

                  return (
                    <tr key={idx}>
                      {/* titles can be arbitrary length so we need to enable word wrapping */}
                      <td className="whitespace-normal break-words">
                        <div>
                          <div className="font-bold">
                            {r.applicationDacTitle}
                          </div>
                          <div className="flex flex-row space-x-2 text-sm">
                            <span className="font-mono opacity-50">
                              {r.releaseKey}
                            </span>
                            {/* a replication of the details in other columns - but we use Tailwind
                              classes to make them disappear on small screens */}
                            <span className="opacity-50 xl:hidden">
                              as {r.roleInRelease}
                            </span>
                            {r.isActivated && (
                              <span className="badge-success badge xl:hidden">
                                activated
                              </span>
                            )}
                            {jobBadgeContent && (
                              <span className="badge-info badge xl:hidden">
                                {jobBadgeContent}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden xl:table-cell">
                        <div>
                          <div className="break-all text-xs">
                            {r.applicationDacIdentifierSystem}
                          </div>
                          <div className="break-all font-mono text-xs opacity-50">
                            {r.applicationDacIdentifierValue}
                          </div>
                        </div>
                      </td>
                      <td className="hidden xl:table-cell">
                        {r.roleInRelease}
                      </td>
                      <td className="hidden xl:table-cell">
                        <div className="flex flex-col space-y-1">
                          <div>
                            {formatLocalDateTime(r.lastUpdatedDateTime)}
                          </div>

                          {r.isActivated && (
                            <div>
                              <span className="badge-success badge">
                                activated
                              </span>
                            </div>
                          )}

                          {jobBadgeContent && (
                            <div>
                              <span className="badge-info badge">
                                {jobBadgeContent}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <button
                          id={`button-view-${r.releaseKey}`}
                          className={classNames("btn-table-action-navigate")}
                          onClick={async () => {
                            navigate(`${r.releaseKey}/detail`);
                          }}
                        >
                          view
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <BoxPaginator
              currentPage={currentPage}
              setPage={setCurrentPage}
              rowCount={currentTotal}
              rowsPerPage={pageSize}
              rowWord="releases"
            />
          </>
        )}
        {releaseQuery.isError && (
          <EagerErrorBoundary
            message={"Something went wrong fetching releases."}
            error={releaseQuery.error}
            styling={"bg-red-100"}
          />
        )}
      </Box>
    </>
  );
};
