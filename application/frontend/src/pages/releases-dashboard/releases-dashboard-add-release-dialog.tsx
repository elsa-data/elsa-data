import React, { Fragment, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { Dialog, Transition } from "@headlessui/react";
import { RemsApprovedApplicationType } from "@umccr/elsa-types";
import { useForm } from "react-hook-form";
import { isNil } from "lodash";
import { REACT_QUERY_RELEASE_KEYS } from "../releases/detail/queries";

type Props = {
  showing: boolean;
  cancelShowing: () => void;
};

export const ReleasesAddReleaseDialog: React.FC<Props> = ({
  showing,
  cancelShowing,
}) => {
  const queryClient = useQueryClient();

  const { register, watch, reset } = useForm<{ newId: number }>();

  const newId = watch("newId");

  const cancelButtonRef = useRef(null);

  const [newReleases, setNewReleases] = useState<RemsApprovedApplicationType[]>(
    []
  );

  const [lastMutateError, setLastMutateError] = useState<string | null>(null);

  const createNewReleaseMutate = useMutation((n: number) =>
    axios
      .post<RemsApprovedApplicationType[]>(`/api/dac/rems/new/${n}`, {})
      .then((response) => response.data)
  );

  useEffect(() => {
    async function fetchData() {
      const n = await axios
        .get<RemsApprovedApplicationType[]>(`/api/dac/rems/new`)
        .then((response) => response.data);
      setNewReleases(n);
    }
    // as soon as we enter 'showing' dialog state we want to fetch all the new
    // applications from the REMS instance
    if (showing) {
      fetchData().then();
    } else {
      // once not showing we want to reset back to initial state
      setNewReleases([]);
      setLastMutateError(null);
      reset();
    }
  }, [showing]);

  return (
    <Transition.Root show={showing} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={cancelShowing}
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
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900"
                    >
                      Add Approved Application
                    </Dialog.Title>
                    <div className="mt-2 prose">
                      <p className="text-sm text-gray-500">
                        This is a list of applications in the given REMS
                        instance that are
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
                      </p>
                    </div>
                    <table className="w-full table-auto text-sm mt-4">
                      <tbody>
                        {newReleases &&
                          newReleases
                            .sort((a, b) => a.when.localeCompare(b.when))
                            .map((nr) => (
                              <tr>
                                <td>
                                  <input
                                    type="radio"
                                    value={nr.remsId}
                                    {...register("newId", {
                                      required: false,
                                    })}
                                  />
                                </td>
                                <td className="border p-2">{nr.when}</td>
                                <td className="border p-2">{nr.whoDisplay}</td>
                                <td className="border p-2">{nr.description}</td>
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={isNil(newId)}
                    className="w-full inline-flex disabled:opacity-50 justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      createNewReleaseMutate.mutate(newId, {
                        onSuccess: () => {
                          // we do not need to wait for this... just trigger the async
                          queryClient.invalidateQueries(
                            REACT_QUERY_RELEASE_KEYS.all
                          );
                          // now close the dialog
                          cancelShowing();
                        },
                        onError: (err: any) =>
                          setLastMutateError(err?.response?.data?.detail),
                      });
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => cancelShowing()}
                    ref={cancelButtonRef}
                  >
                    Cancel
                  </button>
                </div>
                <div>{lastMutateError}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
