import React from "react";
import { useQuery } from "react-query";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Box } from "../../components/boxes";
import { DatasetDeepType, DatasetCaseType } from "@umccr/elsa-types";
import { LayoutBase } from "../../layouts/layout-base";
import JSONToTable from "../../components/json-to-table";
import { fileSize } from "humanize-plus";
import { EagerErrorBoundary } from "../../components/errors";
import { Table } from "flowbite-react";
import { getFirstExternalIdentifierValue } from "../../helpers/database-helper";
import { ConsentPopup } from "../releases/detail/cases-box/consent-popup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMale, faFemale } from "@fortawesome/free-solid-svg-icons";

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
                    "Last Updated": datasetData.updatedDateTime,
                    "Artifact Count": datasetData.summaryArtifactCount,
                    "Artifact Filetypes": datasetData.summaryArtifactIncludes
                      ? datasetData.summaryArtifactIncludes.replaceAll(" ", "/")
                      : "-",
                    "Artifact Size": fileSize(
                      datasetData.summaryArtifactSizeBytes ?? 0
                    ),
                    Configuration: configurationChip(datasetData.isInConfig),
                  }}
                />
              </Box>

              <Box
                heading={
                  <div className="flex items-center	justify-between">
                    <div>{`Dataset`}</div>
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
                  {datasetData && <DatasetTable cases={datasetData.cases} />}
                </div>
              </Box>
              {/* <ConsentBox /> */}
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

const DATASET_COLUMN = [
  { columnTitle: "Case Id", jsonKey: "caseId" },
  { columnTitle: "Case Consent", jsonKey: "caseConsentId" },
  { columnTitle: "Patient Id", jsonKey: "patientId" },
  { columnTitle: "Patient Consent", jsonKey: "patientConsentId" },
];
const DatasetTable: React.FC<{ cases: DatasetCaseType[] }> = ({ cases }) => {
  return (
    <Table striped={true}>
      <Table.Head>
        {DATASET_COLUMN.map((val, i) => (
          <Table.HeadCell key={i}>{val.columnTitle}</Table.HeadCell>
        ))}
      </Table.Head>
      <Table.Body className="divide-y">
        {cases.map((caseVal: DatasetCaseType, caseIdx: number) => {
          const exId = getFirstExternalIdentifierValue(
            caseVal.externalIdentifiers ?? undefined
          );
          const patients = caseVal.patients;

          return patients.map((patient, patientIdx) => {
            const patientId = getFirstExternalIdentifierValue(
              patient.externalIdentifiers ?? undefined
            );
            return (
              <Table.Row key={`caseIdx-${caseIdx}-patientIdx-${patientIdx}`}>
                {DATASET_COLUMN.map(
                  (col: Record<string, string>, colIdx: number) => {
                    return (
                      <React.Fragment
                        key={`${caseIdx}-${patientIdx}-${colIdx}`}
                      >
                        {col.jsonKey == "caseId" ? (
                          <>
                            {patientIdx == 0 && (
                              <Table.Cell
                                rowSpan={patients.length}
                                className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                              >
                                {exId}
                              </Table.Cell>
                            )}
                          </>
                        ) : col.jsonKey == "caseConsentId" ? (
                          <>
                            {patientIdx == 0 && (
                              <Table.Cell
                                rowSpan={patients.length}
                                className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                              >
                                {caseVal.consent?.id ? (
                                  <ConsentPopup
                                    consentId={caseVal.consent.id}
                                  />
                                ) : (
                                  `-`
                                )}
                              </Table.Cell>
                            )}
                          </>
                        ) : col.jsonKey == "patientId" ? (
                          <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
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
                          </Table.Cell>
                        ) : col.jsonKey == "patientConsentId" ? (
                          <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                            {patient.consent?.id ? (
                              <ConsentPopup consentId={patient.consent.id} />
                            ) : (
                              `-`
                            )}
                          </Table.Cell>
                        ) : (
                          <Table.Cell>{col.jsonKey}</Table.Cell>
                        )}
                      </React.Fragment>
                    );
                  }
                )}
              </Table.Row>
            );
          });
        })}
      </Table.Body>
    </Table>
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
