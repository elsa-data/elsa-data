import React, { CSSProperties, useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import {
  partial,
} from "lodash";
import {
  useDropzone,
  FileError,
  FileRejection,
} from 'react-dropzone'
import Papa from "papaparse";
import {
  LocalFile,
  ParseError,
  ParseResult,
} from "papaparse";
import axios from "axios";
import { AustraliaGenomicsDacRedcap } from "@umccr/elsa-types";
import { AustralianGenomicsDacDialog } from "./australian-genomics-dac-dialog";

const GENERIC_ERR_MSG = "Something went wrong";

async function parseCsv<T extends File>(file: T): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results: ParseResult<Record<string, string>>) => {
        if (results.errors.length > 0) {
          return reject(results.errors);
        } else {
          return resolve(results.data);
        }
      },
      error: (error) => {
        return reject([error]);
      },
    });
  });
}

function errorMessage(fileRejections: FileRejection[]): string {
  const errors = fileRejections.flatMap((fileRejection: FileRejection) => {
    const error = fileRejection.errors.map((error) =>
      error.message
    ).join(', ');
    return `${fileRejection.file.name}: ${error}`;
  });
  return errors.join('; ');
}


async function onDropCallback<T extends File>(
  showingRedcapDialogSetter: (b: boolean) => void,
  possibleApplicationsSetter: (d: AustraliaGenomicsDacRedcap[]) => void,
  parseErrorSetter: (s: string | undefined) => void,
  acceptedFiles: T[],
  fileRejections: FileRejection[],
) {
  possibleApplicationsSetter([]);
  parseErrorSetter(undefined);

  if (fileRejections.length > 0) {
    parseErrorSetter(errorMessage(fileRejections));
    showingRedcapDialogSetter(true);
    return;
  }

  const parseCsvPromises = acceptedFiles.map((f) => parseCsv<T>(f));
  const parsed = (await Promise.all(parseCsvPromises)).flat();

  await axios
    .post<AustraliaGenomicsDacRedcap[]>(
      `/api/dac/redcap/possible`,
      parsed,
    )
    .then((response) => response.data)
    .then((d) => {
      possibleApplicationsSetter(d);
      showingRedcapDialogSetter(true);
    })
    .catch((err: any) => {
      console.log(err);
      if (err instanceof Error) {
        parseErrorSetter(err.message);
      } else {
        parseErrorSetter(GENERIC_ERR_MSG);
      }
      showingRedcapDialogSetter(true);
    });
};

export const AustralianGenomicsDacRedcapUploadDiv: React.FC = () => {
  const [showingRedcapDialog, setShowingRedcapDialog] = useState(false);
  const [possibleApplications, setPossibleApplications] = useState<
    AustraliaGenomicsDacRedcap[]
  >([]);
  const [parseError, setParseError] = useState<string | undefined>(undefined);

  const onDrop = useCallback(
    partial(
      onDropCallback,
      setShowingRedcapDialog,
      setPossibleApplications,
      setParseError,
    ),
    []
  );

  const onError = useCallback((err: Error) => {
    console.log(err);
    setParseError(GENERIC_ERR_MSG);
    setShowingRedcapDialog(true);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onError,
    accept: {'text/csv': []},
  });

  return (
    <>
      <div
        {...getRootProps()}
        className="flex flex-col gap-6 items-center"
      >
        <div
          className="w-96 h-60 items-center bg-gray-200 hover:bg-gray-100 border-dashed border-slate-400 border-2 flex flex-col rounded-2xl justify-center p-12"
        >

          <input {...getInputProps()} />
          <FontAwesomeIcon icon={faUpload} className="text-6xl p-5"/>
          <p className="text-center">Drop CSV file here or click to upload</p>
        </div>
      </div>
      <AustralianGenomicsDacDialog
        showing={showingRedcapDialog}
        cancelShowing={() => setShowingRedcapDialog(false)}
        possibleApplications={possibleApplications}
        initialError={parseError}
      />
    </>
  )
}
