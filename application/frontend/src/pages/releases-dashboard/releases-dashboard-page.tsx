import React from "react";
import { useQuery } from "react-query";
import axios from "axios";
import { Box } from "../../components/boxes";
import { ReleaseSummaryType } from "@umccr/elsa-types";
import { LayoutBase } from "../../layouts/layout-base";
import { REACT_QUERY_RELEASE_KEYS } from "../releases/detail/queries";
import { EagerErrorBoundary } from "../../components/errors";
import { IsLoadingDiv } from "../../components/is-loading-div";

export const ReleasesPage: React.FC = () => {
  const query = useQuery(
    REACT_QUERY_RELEASE_KEYS.all,
    async () => {
      return await axios
        .get<ReleaseSummaryType[]>(`/api/releases`)
        .then((response) => response.data);
    },
    {}
  );

  return (
    <LayoutBase>
      <div className="mt-2 flex flex-grow flex-row flex-wrap">
        <Box
          heading="Releases"
          errorMessage={"Something went wrong fetching releases."}
        >
          {query.isLoading && <IsLoadingDiv />}
          {query.isSuccess && query.data && (
            <table className="light:text-gray-400 w-full text-left text-sm text-gray-500">
              <thead className="light:bg-gray-700 light:text-gray-400 bg-gray-50 text-xs uppercase text-gray-700">
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
                  <th scope="col" className="px-6 py-3">
                    Release Id
                  </th>
                  <th scope="col" className="px-6 py-3">
                    DAC Id
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Role (in release)
                  </th>
                  <th scope="col" className="px-6 py-3">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((r, idx) => (
                  <tr
                    key={idx}
                    className="light:bg-gray-800 light:border-gray-700 light:hover:bg-gray-600 border-b bg-white hover:bg-gray-50"
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
                      <span className="text-xs">
                        {r.applicationDacIdentifierSystem}
                      </span>
                      <br />
                      {r.applicationDacIdentifierValue}
                    </th>
                    <td className="px-6 py-4">{r.applicationDacTitle}</td>
                    <td className="px-6 py-4">{r.roleInRelease}</td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/releases/${r.id}`}
                        className="light:text-blue-500 font-medium text-blue-600 hover:underline"
                      >
                        Edit
                      </a>
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
        </Box>
      </div>
    </LayoutBase>
  );
};
