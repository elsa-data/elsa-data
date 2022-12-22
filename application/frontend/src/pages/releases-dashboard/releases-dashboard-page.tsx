import React, { useState } from "react";
import { useQuery } from "react-query";
import axios from "axios";
import { BoxNoPad } from "../../components/boxes";
import { ReleaseSummaryType } from "@umccr/elsa-types";
import { LayoutBase } from "../../layouts/layout-base";
import { REACT_QUERY_RELEASE_KEYS } from "../releases/detail/queries";
import { EagerErrorBoundary } from "../../components/errors";
import { IsLoadingDiv } from "../../components/is-loading-div";
import { useNavigate } from "react-router-dom";
import { BoxPaginator } from "../../components/box-paginator";
import { handleTotalCountHeaders } from "../../helpers/paging-helper";
import { usePageSizer } from "../../hooks/page-sizer";

export const ReleasesPage: React.FC = () => {
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
    <LayoutBase>
      <div className="mt-2 flex flex-grow flex-row flex-wrap">
        <BoxNoPad
          heading="Releases"
          errorMessage={"Something went wrong fetching releases."}
        >
          {query.isLoading && <IsLoadingDiv />}
          {query.isSuccess && query.data && (
            <table className="light:text-gray-400 w-full text-left text-sm text-gray-500">
              <thead className="light:bg-gray-700 light:text-gray-400 border-b uppercase text-gray-700">
                <tr>
                  {/* Left in as an example of checkbox columns if we want to enable bulk ops
                    <th scope="col" className="p-4">
                    <div className="flex items-center">
                      <input
                        id="checkbox-all"
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 light:focus:ring-blue-600 light:ring-offset-gray-800 focus:ring-2 light:bg-gray-700 light:border-gray-600"
                      />
                      <label htmlFor="checkbox-all" className="sr-only">
                        checkbox
                      </label>
                    </div>
                  </th> */}
                  <th scope="col" className="px-6 py-6">
                    Release Id
                  </th>
                  <th scope="col" className="px-6 py-6">
                    DAC Id
                  </th>
                  <th scope="col" className="px-6 py-6">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-6">
                    Role (in release)
                  </th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((r, idx) => (
                  <tr
                    key={idx}
                    className="light:bg-gray-800 light:border-gray-700 light:hover:bg-gray-600 border-b bg-white hover:cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`${r.id}`)}
                  >
                    <th
                      scope="row"
                      className="whitespace-nowrap px-6 py-4 font-mono"
                    >
                      {r.releaseIdentifier}
                    </th>
                    <th
                      scope="row"
                      className="whitespace-nowrap px-6 py-4 font-mono"
                    >
                      <a
                        href={`/releases/${r.id}`}
                        className="hover:text-blue-500"
                      >
                        <span className="text-xs">
                          {r.applicationDacIdentifierSystem}
                        </span>
                        <br />
                        {r.applicationDacIdentifierValue}
                      </a>
                    </th>
                    <td className="px-6 py-4">{r.applicationDacTitle}</td>
                    <td className="px-6 py-4">{r.roleInRelease}</td>
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
        </BoxNoPad>
      </div>
    </LayoutBase>
  );
};
