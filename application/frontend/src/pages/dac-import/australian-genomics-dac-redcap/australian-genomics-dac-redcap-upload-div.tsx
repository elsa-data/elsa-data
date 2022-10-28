import React, { CSSProperties, useState } from "react";
import {
  formatFileSize,
  lightenDarkenColor,
  useCSVReader,
} from "react-papaparse";
import axios from "axios";
import { AustraliaGenomicsDacRedcap } from "@umccr/elsa-types";
import { AustralianGenomicsDacDialog } from "./australian-genomics-dac-dialog";

const GREY = "#CCC";
const GREY_LIGHT = "rgba(255, 255, 255, 0.4)";
const DEFAULT_REMOVE_HOVER_COLOR = "#A01919";
const REMOVE_HOVER_COLOR_LIGHT = lightenDarkenColor(
  DEFAULT_REMOVE_HOVER_COLOR,
  40
);
const GREY_DIM = "#686868";

const styles = {
  zone: {
    alignItems: "center",
    border: `2px dashed ${GREY}`,
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "center",
    padding: 20,
  } as CSSProperties,
  file: {
    background: "linear-gradient(to bottom, #EEE, #DDD)",
    borderRadius: 20,
    display: "flex",
    height: 120,
    width: 120,
    position: "relative",
    zIndex: 10,
    flexDirection: "column",
    justifyContent: "center",
  } as CSSProperties,
  info: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    paddingLeft: 10,
    paddingRight: 10,
  } as CSSProperties,
  size: {
    backgroundColor: GREY_LIGHT,
    borderRadius: 3,
    marginBottom: "0.5em",
    justifyContent: "center",
    display: "flex",
  } as CSSProperties,
  name: {
    backgroundColor: GREY_LIGHT,
    borderRadius: 3,
    fontSize: 12,
    marginBottom: "0.5em",
  } as CSSProperties,
  progressBar: {
    bottom: 14,
    position: "absolute",
    width: "100%",
    paddingLeft: 10,
    paddingRight: 10,
  } as CSSProperties,
  zoneHover: {
    borderColor: GREY_DIM,
  } as CSSProperties,
  default: {
    borderColor: GREY,
  } as CSSProperties,
  remove: {
    height: 23,
    position: "absolute",
    right: 6,
    top: 6,
    width: 23,
  } as CSSProperties,
};

export const AustralianGenomicsDacRedcapUploadDiv: React.FC = () => {
  // in retrospect - this is a pretty awful component - even though it does exactly what we want..
  // possibly pivot to a combination of components with more control
  // ok for the moment though
  const { CSVReader } = useCSVReader();

  const [zoneHover, setZoneHover] = useState(false);
  const [removeHoverColor, setRemoveHoverColor] = useState(
    DEFAULT_REMOVE_HOVER_COLOR
  );

  // we maintain a list of application data structures that the backend has confirmed are
  // possibilities for turning into a Release
  // we pass these into a popup dialog and then the user can choose one which we will submit
  const [possibleApplications, setPossibleApplications] = useState<
    AustraliaGenomicsDacRedcap[]
  >([]);
  const [showingRedcapDialog, setShowingRedcapDialog] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-6">
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
                setZoneHover(false);
              });
          }}
          onDragOver={(event: DragEvent) => {
            event.preventDefault();
            setZoneHover(true);
          }}
          onDragLeave={(event: DragEvent) => {
            event.preventDefault();
            setZoneHover(false);
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
                style={Object.assign(
                  {},
                  styles.zone,
                  zoneHover && styles.zoneHover
                )}
              >
                {acceptedFile ? (
                  <>
                    <div style={styles.file}>
                      <div style={styles.info}>
                        <span style={styles.size}>
                          {formatFileSize(acceptedFile.size)}
                        </span>
                        <span style={styles.name}>{acceptedFile.name}</span>
                      </div>
                      <div style={styles.progressBar}>
                        <ProgressBar />
                      </div>
                      <div
                        {...getRemoveFileProps()}
                        style={styles.remove}
                        onMouseOver={(event: Event) => {
                          event.preventDefault();
                          setRemoveHoverColor(REMOVE_HOVER_COLOR_LIGHT);
                        }}
                        onMouseOut={(event: Event) => {
                          event.preventDefault();
                          setRemoveHoverColor(DEFAULT_REMOVE_HOVER_COLOR);
                        }}
                      >
                        <Remove color={removeHoverColor} />
                      </div>
                    </div>
                  </>
                ) : (
                  "Drop CSV file here or click to upload"
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
