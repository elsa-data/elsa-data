import React from "react";
import { useEnvRelay } from "../providers/env-relay-provider";
import { useQuery } from "react-query";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Box } from "../components/boxes";
import { Tab } from "@headlessui/react";
import classNames from "classnames";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  DatasetGen3SyncRequestType,
  ReleaseRemsSyncRequestType,
  ReleaseType,
} from "@umccr/elsa-types";
import { LayoutBase } from "../layouts/layout-base";
import { VerticalTabs } from "../components/vertical-tabs";

export const ReleasesPage: React.FC = () => {
  const envRelay = useEnvRelay();
  const navigate = useNavigate();

  const { data: releaseData } = useQuery(
    "releases",
    async () => {
      return await axios
        .get<ReleaseType[]>(`/api/releases`)
        .then((response) => response.data);
    },
    {}
  );

  const data = React.useMemo(
    () => [
      {
        col1: "Hello",
        col2: "World",
      },
      {
        col1: "react-table",
        col2: "rocks",
      },
      {
        col1: "whatever",
        col2: "you want",
      },
    ],
    []
  );

  const columns = React.useMemo(
    () => [
      {
        Header: "Column 1",
        accessor: "col1", // accessor is the "key" in the data
      },
      {
        Header: "Column 2",
        accessor: "col2",
      },
    ],
    []
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReleaseRemsSyncRequestType>();
  const onSubmit: SubmitHandler<ReleaseRemsSyncRequestType> = async (data) => {
    const response = await axios.post<ReleaseRemsSyncRequestType>(
      "/api/datasets",
      data
    );

    console.log(response.data);
  };

  return (
    <LayoutBase>
      <div className="flex flex-row flex-wrap flex-grow mt-2">
        {/* SYNCHRONISE DAC BOX */}
        <Box heading="Synchronise Releases with DAC">
          <div className="flex">
            <VerticalTabs tabs={["REMS", "DUOS"]}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-6">
                  <label className="block">
                    <span className="text-xs font-bold text-gray-700 uppercase">
                      Instance URL
                    </span>
                    <input
                      type="text"
                      defaultValue="https://hgpp-rems.dev.umccr.org"
                      {...register("remsUrl", { required: true })}
                      className="mt-1 block w-full rounded-md bg-gray-50 border-transparent focus:border-gray-500 focus:bg-white focus:ring-0"
                    />
                  </label>
                  <input type="submit" className="btn-blue w-60" />
                </div>
              </form>
              <form onSubmit={handleSubmit(onSubmit)}>
                <input type="submit" className="btn-blue w-60" />
              </form>
            </VerticalTabs>
          </div>
        </Box>
        <Box heading="Releases">
          {releaseData && (
            <table className="w-full text-sm text-left text-gray-500 light:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 light:bg-gray-700 light:text-gray-400">
                <tr>
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
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Id
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
                {releaseData.map((r) => (
                  <tr className="bg-white border-b light:bg-gray-800 light:border-gray-700 hover:bg-gray-50 light:hover:bg-gray-600">
                    <td className="w-4 p-4">
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
                    </td>
                    <th
                      scope="row"
                      className="px-6 py-4 font-mono whitespace-nowrap"
                    >
                      {r.applicationDacIdentifier}
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
        </Box>
      </div>
    </LayoutBase>
  );
};
