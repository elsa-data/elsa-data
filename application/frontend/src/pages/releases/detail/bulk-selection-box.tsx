import React, { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Box } from "../../../components/boxes";
import { trpc } from "../../../helpers/trpc";
import { CsvDropzone } from "../../../components/csv-dropzone";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckSquare, faSquare } from "@fortawesome/free-regular-svg-icons";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { EagerErrorBoundary } from "../../../components/errors";

type Props = {
  releaseKey: string;
  isAllowEdit: boolean;
  releaseIsActivated: boolean;
};

export const BulkSelectionBox: React.FC<Props> = ({
  releaseKey,
  isAllowEdit,
  releaseIsActivated,
}) => {
  const [parseError, setParseError] = useState<string>("");

  const trpcUtils = trpc.useContext();

  const specimenMutate = trpc.release.updateReleaseSpecimens.useMutation({
    onSuccess: async () =>
      // once we've altered the selection set we want to invalidate the cases
      // queries *just* of this release
      await trpcUtils.release.getReleaseCases.invalidate({ releaseKey }),
  });

  const onDrop = useCallback(() => setParseError(""), []);

  const onParseCsv = useCallback(
    (op: "add" | "remove") => async (parsed: Record<string, string>[]) => {
      const value = parsed.map((row) => row["specimen_id"]).filter(Boolean);

      if (!value) {
        setParseError("CSV needs to contain at least one row");
        return;
      }

      await specimenMutate.mutate({ releaseKey, op, value });
    },
    [releaseKey, specimenMutate]
  );

  const onParseSelectCsv = useCallback(onParseCsv("add"), [onParseCsv]);
  const onParseUnselectCsv = useCallback(onParseCsv("remove"), [onParseCsv]);

  return (
    <Box
      heading="Bulk Selection"
      applyIsDisabledStyle={!isAllowEdit}
      applyIsDisabledAllInput={!isAllowEdit}
      applyIsActivatedLockedStyle={isAllowEdit && releaseIsActivated}
    >
      <div className="flex justify-evenly">
        <CsvDropzone
          onDrop={onDrop}
          onParseCsv={onParseSelectCsv}
          onError={setParseError}
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
          onParseCsv={onParseUnselectCsv}
          onError={setParseError}
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
    </Box>
  );
};
