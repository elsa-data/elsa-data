import React, { useCallback, useState } from "react";
import { trpc } from "../../../../helpers/trpc";
import { CsvDropzone } from "../../../../components/csv-dropzone";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckSquare, faSquare } from "@fortawesome/free-regular-svg-icons";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { EagerErrorBoundary } from "../../../../components/errors";
import classNames from "classnames";

type ParseCallback = (identifiers: string[]) => void;

type Props = {
  releaseKey: string;
  releaseIsActivated: boolean;
  onParseSelectCsv: ParseCallback;
  onParseUnselectCsv: ParseCallback;
  disabled: boolean;
};

export const BulkSelectionDiv: React.FC<Props> = ({
  releaseKey,
  releaseIsActivated,
  onParseSelectCsv,
  onParseUnselectCsv,
  disabled,
}) => {
  const [parseError, setParseError] = useState<string>("");

  const onDrop = useCallback(() => {
    setParseError("");
  }, []);

  const _onParseCsv = useCallback(
    (cb: ParseCallback) => async (parsed: Record<string, string>[]) => {
      const value = parsed.map((row) => row["specimen_id"]).filter(Boolean);

      if (!value) {
        setParseError("CSV needs to contain at least one row");
        return;
      }

      cb(value);
    },
    [],
  );

  const _onParseSelectCsv = _onParseCsv(onParseSelectCsv);
  const _onParseUnselectCsv = _onParseCsv(onParseUnselectCsv);

  return (
    <>
      <div className="flex flex-wrap space-x-2">
        <CsvDropzone
          onDrop={onDrop}
          onParseCsv={_onParseSelectCsv}
          onError={setParseError}
          disabled={disabled}
        >
          <div className="flex flex-row items-center">
            <FontAwesomeIcon icon={faCheckSquare} className="fa-2xl p-2" />
            <FontAwesomeIcon icon={faCheckSquare} className="fa-lg  p-0" />
            <FontAwesomeIcon icon={faCheckSquare} className="fa-xs  p-1.5" />
            <FontAwesomeIcon icon={faCircle} className="p-0 text-[3px]" />
          </div>
          <p className="text-center">
            Drop CSV of identifiers here to have them <i>selected</i>
          </p>
        </CsvDropzone>
        <CsvDropzone
          onDrop={onDrop}
          onParseCsv={_onParseUnselectCsv}
          onError={setParseError}
          disabled={disabled}
        >
          <div className="flex flex-row items-center">
            <FontAwesomeIcon icon={faSquare} className="fa-2xl p-2" />
            <FontAwesomeIcon icon={faSquare} className="fa-lg  p-0" />
            <FontAwesomeIcon icon={faSquare} className="fa-xs  p-1.5" />
            <FontAwesomeIcon icon={faCircle} className="p-0 text-[3px]" />
          </div>
          <p className="text-center">
            Drop CSV of identifiers here to have them <i>unselected</i>
          </p>
        </CsvDropzone>
      </div>
      {parseError && (
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <EagerErrorBoundary error={new Error(parseError)} />
        </div>
      )}
    </>
  );
};
