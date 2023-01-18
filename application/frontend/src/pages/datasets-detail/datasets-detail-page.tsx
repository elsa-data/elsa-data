import React from "react";
import { useQuery } from "react-query";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Box } from "../../components/boxes";
import { DatasetDeepType } from "@umccr/elsa-types";
import { LayoutBase } from "../../layouts/layout-base";
import JSONToTable from "../../components/json-to-table";
import { fileSize } from "humanize-plus";
import { EagerErrorBoundary } from "../../components/errors";

type DatasetsSpecificPageParams = {
  datasetId: string;
};

const DATASET_REACT_QUERY_KEY = "dataset";

export const DatasetsDetailPage: React.FC = () => {
  const { datasetId: datasetIdParam } = useParams<DatasetsSpecificPageParams>();

  const { data: datasetData, error } = useQuery({
    queryKey: [DATASET_REACT_QUERY_KEY, datasetIdParam],
    queryFn: async ({ queryKey }) => {
      const did = queryKey[1];

      return await axios
        .get<DatasetDeepType>(`/api/datasets/${did}`)
        .then((response) => response.data);
    },
  });

  return (
    <LayoutBase>
      <div className="mt-2 flex flex-grow flex-row flex-wrap">
        <>
          {datasetData && (
            <>
              <Box heading="Summary">
                <JSONToTable
                  jsonObj={{
                    ID: datasetData.id,
                    URI: datasetData.uri,
                    Description: datasetData.description,
                    "Artifact Count": datasetData.summaryArtifactCount,
                    "Artifact Filetypes":
                      datasetData.summaryArtifactIncludes != ""
                        ? datasetData.summaryArtifactIncludes.replaceAll(
                            " ",
                            "/"
                          )
                        : "-",
                    "Artifact Size": fileSize(
                      datasetData.summaryArtifactSizeBytes
                    ),
                    Configuration: configurationChip(datasetData.isInConfig),
                  }}
                />
              </Box>

              <Box
                heading={
                  <div className="flex items-center	justify-between">
                    <div>Content</div>
                    <button
                      disabled={!datasetData.id}
                      onClick={async () =>
                        await axios.post<any>(`/api/datasets/sync/`, {
                          datasetURI: datasetData.uri,
                        })
                      }
                      type="button"
                      className="inline-block	cursor-pointer rounded bg-slate-200 px-6	py-2.5	text-xs font-medium text-slate-500 shadow-md hover:bg-slate-300 hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:bg-slate-400 active:text-white active:shadow-lg"
                    >
                      SYNC
                    </button>
                  </div>
                }
              >
                <div>
                  {datasetData && (
                    <pre>{JSON.stringify(datasetData, null, 2)}</pre>
                  )}
                </div>
              </Box>
            </>
          )}
          {error && (
            <EagerErrorBoundary
              message={"Something went wrong fetching datasets."}
              error={error}
              styling={"bg-red-100"}
            />
          )}
        </>
      </div>
    </LayoutBase>
  );
};

/**
 * Component helper
 */

const configurationChip = (isConfig: boolean) => {
  if (isConfig) {
    return (
      <span className="inline-block whitespace-nowrap rounded-full bg-green-200 py-1 px-2.5 text-center align-baseline text-xs leading-none text-green-700">
        OK
      </span>
    );
  }

  return (
    <span className="inline-block whitespace-nowrap rounded-full bg-orange-200 py-1 px-2.5 text-center align-baseline text-xs leading-none text-orange-600">
      Missing configuration
    </span>
  );
};
