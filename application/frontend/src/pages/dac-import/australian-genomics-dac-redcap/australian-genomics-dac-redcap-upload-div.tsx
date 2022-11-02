import React, { CSSProperties, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import {
  formatFileSize,
  useCSVReader,
} from "react-papaparse";
import axios from "axios";
import { AustraliaGenomicsDacRedcap } from "@umccr/elsa-types";
import { AustralianGenomicsDacDialog } from "./australian-genomics-dac-dialog";
import "./australian-genomics-dac-redcap-upload-div.css";

// TODO: Fix dimensions of zone so that it doesn't change size when a file
//       is dragged to it

export const AustralianGenomicsDacRedcapUploadDiv: React.FC = () => {
  // in retrospect - this is a pretty awful component - even though it does exactly what we want..
  // possibly pivot to a combination of components with more control
  // ok for the moment though
  const { CSVReader } = useCSVReader();

  // we maintain a list of application data structures that the backend has confirmed are
  // possibilities for turning into a Release
  // we pass these into a popup dialog and then the user can choose one which we will submit
  const [possibleApplications, setPossibleApplications] = useState<
    AustraliaGenomicsDacRedcap[]
  >([]);
  const [showingRedcapDialog, setShowingRedcapDialog] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-6 items-center">
        <CSVReader
          onUploadAccepted={async (results: any) => {
            // the full CSV extract we have been given may contain records that we have already
            // turned into releases - or records that we are not interested in
            // we send the whole list to the backend and expect it to return only those of possible
            // interest
            await axios
              .post<AustraliaGenomicsDacRedcap[]>(
                `/api/dac/redcap/possible`,
                results.data
              )
              .then((response) => response.data)
              .then((d) => {
                setPossibleApplications(d);
                setShowingRedcapDialog(true);
              });
          }}
          onDragOver={(event: DragEvent) => {
            event.preventDefault();
          }}
          onDragLeave={(event: DragEvent) => {
            event.preventDefault();
          }}
          config={{
            header: true,
          }}
        >
          {({
            getRootProps,
            acceptedFile,
            ProgressBar,
            getRemoveFileProps,
            Remove,
          }: any) => (
            <>
              <div
                {...getRootProps()}
                className="max-w-2xl items-center bg-gray-200 hover:bg-gray-100 border-dashed border-slate-400 border-2 flex flex-col rounded-2xl justify-center p-12"
              >
                {acceptedFile ? (
                  <>
                    <div className="bg-gradient-to-b from-sky-200 to-sky-300 rounded-2xl flex flex-col h-32 w-32 relative z-10 justify-center">
                      <div className="items-center flex flex-col px-2.5">
                        <span className="rounded-sm mb-0.5 justify-center flex">
                          {formatFileSize(acceptedFile.size)}
                        </span>
                        <span className="rounded-sm text-sx mb-0.5">{acceptedFile.name}</span>
                      </div>
                      <div className="absolute bottom-3.5 w-full px-2.5">
                        <ProgressBar />
                      </div>
                      <div
                        {...getRemoveFileProps()}
                        className="h-6 w-6 absolute top-1.5 right-1.5"
                      >
                        <Remove/>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUpload} className="text-6xl p-5"/>
                    <p>Drop CSV file here or click to upload</p>
                  </>
                )}
              </div>
            </>
          )}
        </CSVReader>
      </div>
      <AustralianGenomicsDacDialog
        showing={showingRedcapDialog}
        cancelShowing={() => setShowingRedcapDialog(false)}
        possibleApplications={possibleApplications}
      />
    </>
  );
};
