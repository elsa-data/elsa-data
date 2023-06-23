import React from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Box } from "../../components/boxes";
import { DatasetCaseType } from "@umccr/elsa-types";
import JSONToTable from "../../components/json-to-table";
import { fileSize } from "humanize-plus";
import { EagerErrorBoundary } from "../../components/errors";
import { getFirstExternalIdentifierValue } from "../../helpers/database-helper";
import { ConsentPopup } from "../releases/detail/cases-box/consent-popup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMale, faFemale, faRotate } from "@fortawesome/free-solid-svg-icons";
import ConsentSummary from "../releases/detail/cases-box/consent-summary";
import { trpc } from "../../helpers/trpc";
import { IsLoadingDiv } from "../../components/is-loading-div";
import { isNil } from "lodash";
import { useUiAllowed } from "../../hooks/ui-allowed";
import { ALLOWED_DATASET_UPDATE } from "@umccr/elsa-constants";
import { useQueryClient } from "@tanstack/react-query";
import { Table } from "../../components/tables";

type DatasetsSpecificPageParams = {
  datasetUri: string;
};

export const DatasetsDetailPage: React.FC = () => {
  const uiAllowed = useUiAllowed();
  const queryClient = useQueryClient();

  const { datasetUri: encodedDatasetUri } =
    useParams<DatasetsSpecificPageParams>();
  const datasetUri = decodeURIComponent(encodedDatasetUri ?? "").replaceAll(
    "[dot]",
    "."
  );

  const datasetMutate = trpc.datasetRouter.updateDataset.useMutation({
    onSettled: () => {
      queryClient.invalidateQueries();
    },
  });

  const datasetQuery = trpc.datasetRouter.getSingleDataset.useQuery(
    {
      datasetUri: datasetUri,
    },
    {
      keepPreviousData: true,
    }
  );

  if (datasetQuery.isLoading) return <IsLoadingDiv />;
  const data = datasetQuery?.data;
  if (isNil(data))
    return (
      <div className={""}>
        <p>No dataset URI found</p>
      </div>
    );

  // Some ArtifactEnum COUNT
  let fileTypes = "";
  if (data.bclCount) fileTypes += `BCL(${data.bclCount}) `;
  if (data.fastqCount) fileTypes += `FASTQ(${data.fastqCount}) `;
  if (data.vcfCount) fileTypes += `VCF(${data.vcfCount}) `;
  if (data.bamCount) fileTypes += `BAM(${data.bamCount}) `;
  if (data.cramCount) fileTypes += `CRAM(${data.cramCount}) `;

  return (
    <div className="mt-2 flex flex-grow flex-row flex-wrap space-y-4">
      <>
        {datasetQuery.isError && (
          <EagerErrorBoundary error={datasetQuery.error} />
        )}
        {datasetMutate.isError && !datasetQuery.isError && (
          <EagerErrorBoundary error={datasetMutate.error} />
        )}

        {data && (
          <>
            <Box heading="Summary">
              <JSONToTable
                jsonObj={{
                  URI: data.uri,
                  Description: data.description,
                  "Last Updated": data.updatedDateTime ?? "-",
                  "Artifact Count": data.totalArtifactCount,
                  "Artifact Filetypes":
                    fileTypes != ""
                      ? fileTypes.trim().replaceAll(" ", ", ")
                      : "-",
                  "Artifact Size": fileSize(data.totalArtifactSizeBytes ?? 0),
                  Configuration: configurationChip(data.isInConfig),
                }}
              />
            </Box>

            <Box
              heading={
                <div className="flex items-center	justify-between">
                  <div>Dataset</div>

                  {uiAllowed.has(ALLOWED_DATASET_UPDATE) && (
                    <button
                      className="btn-outline btn-xs btn ml-2"
                      onClick={() => datasetMutate.mutate({ datasetUri })}
                    >
                      <FontAwesomeIcon
                        spin={datasetMutate.isLoading}
                        icon={faRotate}
                      />
                    </button>
                  )}
                </div>
              }
            >
              <div className="overflow-auto">
                {data && <DatasetTable cases={data.cases} />}
              </div>
            </Box>
            {/* <ConsentBox /> */}
          </>
        )}
      </>
    </div>
  );
};

const DATASET_COLUMN = [
  { columnTitle: "Case Id", jsonKey: "caseId" },
  { columnTitle: "Case Consent", jsonKey: "caseConsentId" },
  { columnTitle: "Patient Id", jsonKey: "patientId" },
  { columnTitle: "Patient Consent", jsonKey: "patientConsentId" },
];
const DatasetTable: React.FC<{ cases: DatasetCaseType[] }> = ({ cases }) => {
  return (
    <Table
      tableHead={
        <tr>
          {DATASET_COLUMN.map((val, i) => (
            <th key={i}>{val.columnTitle}</th>
          ))}
        </tr>
      }
      tableBody={cases.map((caseVal: DatasetCaseType, caseIdx: number) => {
        const exId = getFirstExternalIdentifierValue(
          caseVal.externalIdentifiers ?? undefined
        );
        const patients = caseVal.patients;

        return patients.map((patient, patientIdx) => {
          const patientId = getFirstExternalIdentifierValue(
            patient.externalIdentifiers ?? undefined
          );
          return (
            <tr key={`caseIdx-${caseIdx}-patientIdx-${patientIdx}`}>
              {DATASET_COLUMN.map(
                (col: Record<string, string>, colIdx: number) => {
                  return (
                    <React.Fragment key={`${caseIdx}-${patientIdx}-${colIdx}`}>
                      {col.jsonKey == "caseId" ? (
                        <>
                          {patientIdx == 0 && (
                            <td
                              rowSpan={patients.length}
                              className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                            >
                              {exId}
                            </td>
                          )}
                        </>
                      ) : col.jsonKey == "caseConsentId" ? (
                        <>
                          {patientIdx == 0 && (
                            <td
                              rowSpan={patients.length}
                              className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                            >
                              {caseVal.consent?.id ? (
                                <ConsentSummary
                                  consentId={caseVal.consent.id}
                                />
                              ) : (
                                `-`
                              )}
                            </td>
                          )}
                        </>
                      ) : col.jsonKey == "patientId" ? (
                        <td className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                          <>
                            {patient.sexAtBirth == "female" ? (
                              <FontAwesomeIcon icon={faFemale} />
                            ) : patient.sexAtBirth == "male" ? (
                              <FontAwesomeIcon icon={faMale} />
                            ) : (
                              <></>
                            )}

                            {` - ${patientId}`}
                          </>
                        </td>
                      ) : col.jsonKey == "patientConsentId" ? (
                        <td className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                          {patient.consent?.id ? (
                            <ConsentSummary consentId={patient.consent.id} />
                          ) : (
                            `-`
                          )}
                        </td>
                      ) : (
                        <td>{col.jsonKey}</td>
                      )}
                    </React.Fragment>
                  );
                }
              )}
            </tr>
          );
        });
      })}
    />
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
