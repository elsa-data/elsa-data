import React, { Fragment } from "react";
import { useEnvRelay } from "../providers/env-relay-provider";
import { useQuery } from "react-query";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Box } from "../components/boxes";
import {
  DatasetGen3SyncRequestType,
  DatasetLightType,
} from "@umccr/elsa-types";
import { fileSize } from "humanize-plus";
import { Tab } from "@headlessui/react";
import classNames from "classnames";
import { useForm, SubmitHandler } from "react-hook-form";
import { LayoutBase } from "../layouts/layout-base";

export const DatasetsPage: React.FC = () => {
  const envRelay = useEnvRelay();
  const navigate = useNavigate();

  const { data: datasetsData } = useQuery(
    "datasets",
    async () => {
      return await axios
        .get<DatasetLightType[]>(`/api/datasets`)
        .then((response) => response.data);
    },
    {}
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DatasetGen3SyncRequestType>();
  const onSubmit: SubmitHandler<DatasetGen3SyncRequestType> = async (data) => {
    const response = await axios.post<DatasetGen3SyncRequestType>(
      "/api/datasets",
      data
    );

    console.log(response.data);
  };

  const uriBlock = () => (
    <label className="block">
      <div className="flow-root">
        <p className="float-left">
          <span className="text-xs font-bold uppercase text-gray-700">
            URI *
          </span>
        </p>
        <p className="float-right">
          {errors.uri && (
            <span className="text-xs font-bold  uppercase text-red-700">
              you must fill in this field
            </span>
          )}
        </p>
      </div>
      <input
        type="text"
        {...register("uri", { required: true })}
        className={classNames(
          "mt-1 block rounded-md w-full bg-gray-50 border-transparent font-mono focus:border-gray-500 focus:bg-white focus:ring-0",
          errors.uri ? "ring-2 ring-red-500" : ""
        )}
        placeholder="urn:fdc:domain.org:year:id"
      />
    </label>
  );

  return (
    <LayoutBase>
      <div className="flex flex-row flex-wrap flex-grow mt-2">
        <Box heading="Datasets">
          {datasetsData && (
            <table className="w-full text-sm text-left text-gray-500 border-black border-1 border-solid">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    URI
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Contains
                  </th>
                  <th scope="col" className="px-6 py-3">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {datasetsData.map((ds) => (
                  <tr className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono whitespace-nowrap">
                      {ds.uri}
                    </td>
                    <td className="px-6 py-4">{ds.description}</td>
                    <td className="px-6 py-4">
                      {ds.summaryArtifactCount} artifacts of{" "}
                      {ds.summaryArtifactIncludes.replaceAll(" ", "/")}{" "}
                      totalling {fileSize(ds.summaryArtifactSizeBytes)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/datasets/${ds.id}`}
                        className="font-medium text-blue-600 light:text-blue-500 hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Box>
        <Box heading="Import/Update Dataset">
          <div className="flex">
            <Tab.Group vertical={true}>
              <Tab.List className="flex-none w-1/5 flex-col space-x-1 rounded-xl bg-blue-900/20 p-1">
                <Tab
                  className={({ selected }) =>
                    classNames(
                      "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700",
                      "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                      selected
                        ? "bg-white shadow"
                        : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                    )
                  }
                >
                  gen3
                </Tab>
                <Tab
                  className={({ selected }) =>
                    classNames(
                      "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700",
                      "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                      selected
                        ? "bg-white shadow"
                        : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                    )
                  }
                >
                  UMCCR Data Portal
                </Tab>
                <Tab
                  className={({ selected }) =>
                    classNames(
                      "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700",
                      "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                      selected
                        ? "bg-white shadow"
                        : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                    )
                  }
                >
                  CSV/TSV/JSON
                </Tab>
              </Tab.List>
              <Tab.Panels className="grow">
                <Tab.Panel className="p-6">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-6">
                      {uriBlock()}

                      <label className="block">
                        <span className="text-xs font-bold text-gray-700 uppercase">
                          Instance URL
                        </span>
                        <input
                          type="text"
                          {...register("gen3Url", { required: true })}
                          className="mt-1 block w-full rounded-md bg-gray-50 border-transparent focus:border-gray-500 focus:bg-white focus:ring-0"
                          placeholder="https://gen3.dev.umccr.org"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-bold text-gray-700 uppercase">
                          Bearer JWT
                        </span>
                        <textarea
                          {...register("gen3Bearer", { required: true })}
                          className="
                    mt-1
                    block
                    w-full
                    rounded-md
                    bg-gray-50
                    border-transparent
                    focus:border-gray-500 focus:bg-white focus:ring-0
                  "
                          rows={3}
                        ></textarea>
                      </label>
                      <input type="submit" className="btn-blue w-60" />
                    </div>
                  </form>
                </Tab.Panel>
                <Tab.Panel className="p-6">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-6">{uriBlock()}</div>
                  </form>
                </Tab.Panel>
                <Tab.Panel className="p-6">There</Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </Box>
      </div>
    </LayoutBase>
  );
};
