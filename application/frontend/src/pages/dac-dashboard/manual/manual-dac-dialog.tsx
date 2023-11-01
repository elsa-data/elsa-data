import React, { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ReleaseManualType } from "@umccr/elsa-types";
import { Controller, useForm } from "react-hook-form";
import { REACT_QUERY_RELEASE_KEYS } from "../../releases/queries";
import { SelectDialogBase } from "../../../components/select-dialog-base";
import { useNavigate } from "react-router-dom";
import { ErrorBoundary } from "../../../components/errors";
import { RhRadioItem, RhRadios } from "../../../components/rh/rh-radios";
import Select from "react-select";
import { useLoggedInUserConfigRelay } from "../../../providers/logged-in-user-config-relay-provider";
import { SuccessCancelButtons } from "../../../components/success-cancel-buttons";

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

export const ManualDacDialog: React.FC<Props> = ({
  showing,
  cancelShowing,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loggedInUserConfig = useLoggedInUserConfigRelay();

  const {
    control,
    handleSubmit,
    register,
    getValues,
    formState: { errors },
  } = useForm<ReleaseManualType>();

  const cancelButtonRef = useRef(null);

  const [lastMutateError, setLastMutateError] = useState<string | undefined>(
    undefined,
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
    },
  );

  return (
    <ErrorBoundary>
      <SelectDialogBase
        showing={showing}
        cancelShowing={cancelShowing}
        title="Create Release Manually"
        buttons={
          <SuccessCancelButtons
            isLoading={createNewReleaseMutate.isLoading}
            isSuccessDisabled={createNewReleaseMutate.isLoading}
            successButtonLabel={"Create"}
            onSuccess={handleSubmit(() => createNewReleaseMutate.mutate())}
            cancelButtonLabel={"Cancel"}
            onCancel={cancelShowing}
            cancelButtonRef={cancelButtonRef}
          />
        }
        content={
          <>
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
                      id="datasetSelector"
                      placeholder="Datasets"
                      noOptionsMessage={() =>
                        "There are no datasets to select from"
                      }
                      options={
                        loggedInUserConfig?.datasets
                          ? Object.entries(loggedInUserConfig.datasets).map(
                              (d) => ({ value: d[0], label: d[1] }),
                            )
                          : []
                      }
                      isMulti={true}
                      isLoading={!loggedInUserConfig}
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
