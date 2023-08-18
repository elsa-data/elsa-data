import React, { useCallback } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import Papa, { ParseResult } from "papaparse";

const GENERIC_ERR_MSG = "Something went wrong";

const errorMessage = (fileRejections: FileRejection[]): string => {
  const errors = fileRejections.flatMap((fileRejection: FileRejection) => {
    const error = fileRejection.errors.map((error) => error.message).join(", ");
    return `${fileRejection.file.name}: ${error}`;
  });
  return errors.join("; ");
};

export const formatError = (err: any): string => {
  console.log(err);

  if (err instanceof Error) {
    return err.message;
  } else if (typeof err === "string") {
    return err;
  } else {
    return GENERIC_ERR_MSG;
  }
};

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

type Props = React.PropsWithChildren<{
  onDrop: () => void;
  onParseCsv:
    | ((value: Record<string, string>[]) => void | PromiseLike<void>)
    | null
    | undefined;
  onError: (err: string) => void;
}>;

export const CsvDropzone: React.FC<Props> = ({
  children,
  onDrop,
  onParseCsv,
  onError,
}) => {
  const _onDrop = useCallback(
    (acceptedFiles: File[], filesRejected: FileRejection[]) => {
      onDrop();

      if (filesRejected.length > 0 || acceptedFiles.length !== 1) {
        onError(formatError(errorMessage(filesRejected)));
        return;
      }

      parseCsv(acceptedFiles[0])
        .then(onParseCsv)
        .catch(() =>
          onError(formatError(`${GENERIC_ERR_MSG} while parsing the CSV file`))
        );
    },
    []
  );

  const _onDropError = useCallback(
    (err: Error) => onError(formatError(err)),
    []
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: _onDrop,
    onError: _onDropError,
    accept: { "text/csv": [] },
    // I don't think we are prepared in a UI sense to handle multiple CSVs so lets not allow
    multiple: false,
  });

  return (
    <>
      <div {...getRootProps()} className="flex flex-col items-start gap-6">
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-400 bg-gray-200 p-4 hover:bg-gray-100">
          <input {...getInputProps()} />
          {children}
        </div>
      </div>
    </>
  );
};
