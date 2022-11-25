import React from "react";
import { useQuery } from "react-query";
import axios from "axios";
import { Box } from "../../components/boxes";
import { ReleaseSummaryType } from "@umccr/elsa-types";
import { LayoutBase } from "../../layouts/layout-base";
import { REACT_QUERY_RELEASE_KEYS } from "../releases/detail/queries";
import {ErrorBoundary} from "../../components/error-boundary";

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
      <div className="flex flex-row flex-wrap flex-grow mt-2">
        <Box heading="Releases">
          {query.data && (
            <table className="w-full text-sm text-left text-gray-500 light:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 light:bg-gray-700 light:text-gray-400">
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
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((r) => (
                  <tr className="bg-white border-b light:bg-gray-800 light:border-gray-700 hover:bg-gray-50 light:hover:bg-gray-600">
                    {/*<td className="w-4 p-4">
                      <div className="flex items-center">
                        <input
                          id="checkbox-table-1"
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 light:focus:ring-blue-600 light:ring-offset-gray-800 focus:ring-2 light:bg-gray-700 light:border-gray-600"
                        />
                        <label htmlFor="checkbox-table-1" className="sr-only">
                          checkbox
                        </label>
                      </div>
                    </td>*/}
                    <th
                      scope="row"
                      className="px-6 py-4 font-mono whitespace-nowrap"
                    >
                      {r.releaseIdentifier}
                    </th>
                    <th
                      scope="row"
                      className="px-6 py-4 font-mono whitespace-nowrap"
                    >
                      <span className="text-xs">
                        {r.applicationDacIdentifierSystem}
                      </span>
                      <br />
                      {r.applicationDacIdentifierValue}
                    </th>
                    <td className="px-6 py-4">{r.applicationDacTitle}</td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/releases/${r.id}`}
                        className="font-medium text-blue-600 light:text-blue-500 hover:underline"
                      >
                        Edit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {query.isError && <ErrorBoundary error={query.error}></ErrorBoundary>}
        </Box>
      </div>
    </LayoutBase>
  );
};
