import React, { useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import { DropEvent, FileRejection, useDropzone } from "react-dropzone";
import Papa, { ParseResult } from "papaparse";
import { AustraliaGenomicsDacRedcap } from "@umccr/elsa-types";
import { AustralianGenomicsDacDialog } from "./australian-genomics-dac-dialog";
import { trpc } from "../../../helpers/trpc";

const GENERIC_ERR_MSG = "Something went wrong.";

async function parseCsv<T extends File>(
  file: T
): Promise<Record<string, string>[]> {
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
      skipEmptyLines: "greedy",
    });
  });
}

function errorMessage(fileRejections: FileRejection[]): string {
  const errors = fileRejections.flatMap((fileRejection: FileRejection) => {
    const error = fileRejection.errors.map((error) => error.message).join(", ");
    return `${fileRejection.file.name}: ${error}`;
  });
  return errors.join("; ");
}

function formatError(
  err: any,
  parseErrorSetter: (s: string | undefined) => void,
  showingRedcapDialogSetter: (b: boolean) => void
) {
  console.log(err);

  if (err instanceof Error) {
    parseErrorSetter(err.message);
  } else if (typeof err === "string") {
    parseErrorSetter(err);
  } else {
    parseErrorSetter(GENERIC_ERR_MSG);
  }

  showingRedcapDialogSetter(true);
}

type Props = {
  dacId: string;
};

export const AustralianGenomicsDacRedcapTriggerDiv: React.FC<Props> = ({
  dacId,
}) => {
  const [showingRedcapDialog, setShowingRedcapDialog] = useState(false);

  const [possibleApplications, setPossibleApplications] = useState<
    AustraliaGenomicsDacRedcap[]
  >([]);

  const [parseError, setParseError] = useState<string | undefined>(undefined);

  const detectQuery = trpc.dac.detectNew.useMutation({
    onSuccess: (d) => {
      setPossibleApplications(d as any);
      setShowingRedcapDialog(true);
    },
    onError: (err) => {
      formatError(err, setParseError, setShowingRedcapDialog);
    },
  });

  const onDrop = useCallback(
    (
      acceptedFiles: File[],
      filesRejected: FileRejection[],
      event: DropEvent
    ) => {
      setPossibleApplications([]);
      setParseError(undefined);

      if (filesRejected.length > 0) {
        formatError(
          errorMessage(filesRejected),
          setParseError,
          setShowingRedcapDialog
        );
        return;
      }

      if (acceptedFiles.length === 0 || acceptedFiles.length > 1) {
        formatError(errorMessage([]), setParseError, setShowingRedcapDialog);
        return;
      }

      parseCsv(acceptedFiles[0])
        .then((parsed) => {
          detectQuery.mutate({
            dacId: dacId,
            dacData: parsed,
          });
        })
        .catch((e) => {
          formatError(
            `${GENERIC_ERR_MSG} while parsing CSV file`,
            setParseError,
            setShowingRedcapDialog
          );
        });
    },
    []
  );

  const onError = useCallback((err: Error) => {
    formatError(err, setParseError, setShowingRedcapDialog);
  }, []);

  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    onDrop: onDrop,
    onError,
    accept: { "text/csv": [] },
    // I don't think we are prepared in a UI sense to handle multiple CSVs so lets not allow
    multiple: false,
  });

  return (
    <>
      <div {...getRootProps()} className="flex flex-col items-start gap-6">
        <div className="flex h-32 w-60 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-400 bg-gray-200 p-12 hover:bg-gray-100">
          <input {...getInputProps()} />
          <FontAwesomeIcon icon={faUpload} className="fa-2xl p-5" />
          <p className="text-center">Drop CSV file here or click to upload</p>
        </div>
      </div>
      <AustralianGenomicsDacDialog
        showing={showingRedcapDialog}
        cancelShowing={() => setShowingRedcapDialog(false)}
        dacId={dacId}
        possibleApplications={possibleApplications}
        initialError={parseError}
      />
    </>
  );
};
