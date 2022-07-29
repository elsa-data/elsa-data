import React, { Fragment, useEffect, useRef, useState } from "react";
import { useEnvRelay } from "../../providers/env-relay-provider";
import { useQuery } from "react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Box } from "../../components/boxes";
import { Dialog, Transition } from "@headlessui/react";
import {
  ReleaseDetailType,
  RemsApprovedApplicationType,
} from "@umccr/elsa-types";
import { LayoutBase } from "../../layouts/layout-base";
import { VerticalTabs } from "../../components/vertical-tabs";

export const ReleasesPage: React.FC = () => {
  const envRelay = useEnvRelay();
  const navigate = useNavigate();

  const { data: releaseData } = useQuery(
    "releases",
    async () => {
      return await axios
        .get<ReleaseDetailType[]>(`/api/releases`)
        .then((response) => response.data);
    },
    {}
  );

  const cancelButtonRef = useRef(null);

  const [showingRemsDialog, setShowingRemsDialog] = useState(false);
  const [newReleases, setNewReleases] = useState<RemsApprovedApplicationType[]>(
    []
  );

  useEffect(() => {
    async function fetchData() {
      const n = await axios
        .get<RemsApprovedApplicationType[]>(`/api/dac/rems/new`)
        .then((response) => response.data);
      setNewReleases(n);
    }
    if (showingRemsDialog) {
      fetchData();
    }
  }, [showingRemsDialog]);

  return (
    <LayoutBase>
      <div className="flex flex-row flex-wrap flex-grow mt-2">
        {/* SYNCHRONISE DAC BOX */}
        <Box heading="Synchronise Releases with DAC">
          <div className="flex">
            <VerticalTabs tabs={["REMS", "DUOS"]}>
              <div className="flex flex-col gap-6">
                <label className="block">
                  <span className="text-xs font-bold text-gray-700 uppercase">
                    Instance URL
                  </span>
                  <input
                    type="text"
                    defaultValue="https://hgpp-rems.dev.umccr.org"
                    className="mt-1 block w-full rounded-md bg-gray-50 border-transparent focus:border-gray-500 focus:bg-white focus:ring-0"
                  />
                </label>
                <button
                  className="btn-blue w-60 h-8 rounded"
                  onClick={() => setShowingRemsDialog(true)}
                >
                  Find New Applications
                </button>
              </div>
              <form>
                <p>Fetch from DUOS</p>
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
      <Transition.Root show={showingRemsDialog} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          initialFocus={cancelButtonRef}
          onClose={setShowingRemsDialog}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-3xl sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"></div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <Dialog.Title
                          as="h3"
                          className="text-lg leading-6 font-medium text-gray-900"
                        >
                          Add Approved Application
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            This is a list of applications in the given REMS
                            instance that are
                          </p>
                          <ul className="text-sm text-gray-500 list-disc">
                            <li>approved</li>
                            <li>
                              not already associated with an Elsa Data release
                            </li>
                            <li>
                              involve a resource that corresponds to a dataset
                              under Elsa Data control
                            </li>
                          </ul>
                        </div>
                        <table className="table-auto text-sm mt-4">
                          <tbody>
                            {newReleases &&
                              newReleases.map((nr) => (
                                <tr>
                                  <td>
                                    <input type="radio" name="application" />
                                  </td>
                                  <td className="border p-2">{nr.when}</td>
                                  <td className="border p-2">
                                    {nr.whoDisplay}
                                  </td>
                                  <td className="border p-2">
                                    {nr.description}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setShowingRemsDialog(false)}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setShowingRemsDialog(false)}
                      ref={cancelButtonRef}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </LayoutBase>
  );
};
