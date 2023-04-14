import React, { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ReleaseManualType } from "@umccr/elsa-types";
import { Controller, useForm } from "react-hook-form";
import { REACT_QUERY_RELEASE_KEYS } from "../../releases/queries";
import { SelectDialogBase } from "../../../components/select-dialog-base";
import { useNavigate } from "react-router-dom";
import { EagerErrorBoundary, ErrorBoundary } from "../../../components/errors";
import { RhChecks, RhCheckItem } from "../../../components/rh/rh-checks";
import { RhRadioItem, RhRadios } from "../../../components/rh/rh-radios";
import Select from "react-select";
import { trpc } from "../../../helpers/trpc";

type Props = {
  showing: boolean;
  cancelShowing: () => void;
};

const Required: React.FC = () => {
  return (
    <span className="mb-5 -mt-2.5 block text-sm text-red-600">
      This field is required
    </span>
  );
};

export const ReleasesManualEntryDialog: React.FC<Props> = ({
  showing,
  cancelShowing,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Paginate dataset URIs
  const [datasetUriOptions, setDatasetUriOptions] = useState<
    {
      value: string;
      label: string;
    }[]
  >([]);
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentTotal, setCurrentTotal] = useState<number>(1);
  const maxPage = Math.ceil(currentTotal / pageSize);

  const {
    control,
    handleSubmit,
    register,
    getValues,
    formState: { errors },
  } = useForm<ReleaseManualType>();

  const cancelButtonRef = useRef(null);

  const [lastMutateError, setLastMutateError] = useState<string | undefined>(
    undefined
  );

  const createNewReleaseMutate = useMutation(
    () =>
      axios
        .post<string>("/api/release", getValues())
        .then((response) => response.data),
    {
      onSuccess: (newReleaseKey) => {
        // invalidate the keys so that going to the dashboard will be refreshed
        queryClient.invalidateQueries(REACT_QUERY_RELEASE_KEYS.all).then(() => {
          // bounce us to the details page for the release we just made
          navigate(`/releases/${newReleaseKey}/detail`);
        });

        // now close the dialog
        cancelShowing();
      },
      onError: (err: any) => setLastMutateError(err?.response?.data?.detail),
    }
  );

  const datasetQuery = trpc.datasetRouter.getAllDataset.useQuery(
    {
      page: currentPage,
      includeDeletedFile: false,
    },
    {
      keepPreviousData: true,
      onSuccess: (res) => {
        setCurrentTotal(res.total);

        const datasetMenuOptions = res.data?.map((x) => ({
          value: x.uri,
          label: x.uri,
        }));
        if (datasetMenuOptions)
          setDatasetUriOptions((prev) => [...prev, ...datasetMenuOptions]);
      },
    }
  );

  const isDatasetMenuLoading = datasetQuery.isLoading;
  const fetchDatasetError = datasetQuery.error;
  const isFetchDatasetError = datasetQuery.isError;

  if (isFetchDatasetError) {
    return (
      <EagerErrorBoundary
        message={"Something went wrong fetching datasets."}
        error={fetchDatasetError}
        styling={"bg-red-100"}
      />
    );
  }

  return (
    <ErrorBoundary styling={"bg-red-100"}>
      <SelectDialogBase
        showing={showing}
        cancelShowing={cancelShowing}
        title="Manually Create a Release"
        buttons={
          <>
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleSubmit(() => createNewReleaseMutate.mutate())}
            >
              Create
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => cancelShowing()}
              ref={cancelButtonRef}
            >
              Cancel
            </button>{" "}
          </>
        }
        content={
          <>
            <div className="prose mt-2">
              <p className="text-sm text-gray-500">
                This form should only be used in the case where an application
                for data could not be imported via an upstream DAC such as REMS
                or REDCap.
              </p>
            </div>
            <div>
              <input
                type="text"
                className="my-4 block w-full rounded-lg border border-gray-300 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Release Title"
                {...register("releaseTitle", { required: true })}
              />
              {errors.releaseTitle && <Required />}
              <textarea
                className="my-4 block w-full rounded-lg border border-gray-300 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Release Description"
                {...register("releaseDescription", { required: true })}
              />
              {errors.releaseDescription && <Required />}
              <Controller
                control={control}
                name="datasetUris"
                rules={{ required: true }}
                render={({ field: { onChange } }) => (
                  <>
                    <Select
                      placeholder="Dataset URIs"
                      noOptionsMessage={() =>
                        "There are no datasets to select from"
                      }
                      options={datasetUriOptions}
                      isMulti={true}
                      isLoading={isDatasetMenuLoading}
                      isSearchable={false}
                      closeMenuOnSelect={false}
                      classNames={{
                        container: () =>
                          "!my-4 !focus:border-blue-500 !focus:ring-blue-500",
                        control: () => "!rounded-lg !border !border-gray-300",
                        option: () => "!font-medium !text-gray-700",
                        placeholder: () => "!text-sm !text-gray-500",
                      }}
                      onChange={(opts) =>
                        onChange(opts.map((opt) => opt.value))
                      }
                    />
                    {currentPage < maxPage && (
                      <div
                        className="cursor-pointer text-xs text-gray-500 underline"
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Load more dataset URIs options
                      </div>
                    )}
                  </>
                )}
              />
              {errors.datasetUris && <Required />}
              <Controller
                control={control}
                name="studyType"
                rules={{ required: true }}
                render={({ field: { onChange } }) => (
                  <RhRadios label="Study Type" className="my-4">
                    <RhRadioItem
                      name="studyType"
                      label="Population Origins or Ancestry Research Only"
                      value="POA"
                      onChange={(e) => onChange(e.target.value)}
                    />

                    <RhRadioItem
                      name="studyType"
                      label="General Research Use"
                      value="GRU"
                      onChange={(e) => onChange(e.target.value)}
                    />

                    <RhRadioItem
                      name="studyType"
                      label="Health or Medical or Biomedical Research"
                      value="HMB"
                      onChange={(e) => onChange(e.target.value)}
                    />

                    <RhRadioItem
                      name="studyType"
                      label="Disease Specific Research"
                      value="DS"
                      onChange={(e) => onChange(e.target.value)}
                    />

                    <RhRadioItem
                      name="studyType"
                      label="Clinical Care Use"
                      value="CC"
                      onChange={(e) => onChange(e.target.value)}
                    />
                  </RhRadios>
                )}
              />
              {errors.studyType && <Required />}
              <input
                type="text"
                className="my-4 block w-full rounded-lg border border-gray-300 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Applicant Email Address(es)"
                {...register("applicantEmailAddresses", { required: true })}
              />
              {errors.applicantEmailAddresses && <Required />}
            </div>
          </>
        }
        errorMessage={lastMutateError}
        initialFocus={cancelButtonRef}
      />
    </ErrorBoundary>
  );
};
