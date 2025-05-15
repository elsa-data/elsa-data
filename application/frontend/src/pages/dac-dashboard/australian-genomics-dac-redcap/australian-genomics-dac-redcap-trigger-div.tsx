import React, { useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import { AustraliaGenomicsDacRedcap } from "../../../../../backend/src/shared/csv-australian-genomics";
import { AustralianGenomicsDacDialog } from "./australian-genomics-dac-dialog";
import { CsvDropzone, formatError } from "../../../components/csv-dropzone";
import { useTRPC } from "../../../helpers/trpc-modern.ts";
import { useMutation } from "@tanstack/react-query";

type Props = {
  dacId: string;
};

export const AustralianGenomicsDacRedcapTriggerDiv: React.FC<Props> = ({
  dacId,
}) => {
  const trpc = useTRPC();

  const [showingRedcapDialog, setShowingRedcapDialog] = useState(false);

  const [possibleApplications, setPossibleApplications] = useState<
    AustraliaGenomicsDacRedcap[]
  >([]);

  const [parseError, setParseError] = useState<string | undefined>(undefined);

  const detectQueryOptions = trpc.dac.detectNew.mutationOptions({
    onSuccess: (d) => {
      setPossibleApplications(d as any);
      setShowingRedcapDialog(true);
    },
    onError: (err) => {
      setParseError(formatError(err));
      setShowingRedcapDialog(true);
    },
  });

  const detectQuery = useMutation(detectQueryOptions);

  const onDrop = useCallback(() => {
    setPossibleApplications([]);
    setParseError(undefined);
  }, []);

  const onError = useCallback((err: string) => {
    setShowingRedcapDialog(true);
    setParseError(err);
  }, []);

  const onParseCsv = useCallback(
    (parsed: Record<string, string>[]) => {
      detectQuery.mutate({
        dacId: dacId,
        dacData: parsed,
      });
    },
    [detectQuery, dacId],
  );

  const cancelShowing = useCallback(() => setShowingRedcapDialog(false), []);

  return (
    <>
      <CsvDropzone onDrop={onDrop} onParseCsv={onParseCsv} onError={onError}>
        <FontAwesomeIcon icon={faUpload} className="fa-2xl p-5" />
        <p className="text-center">Drop CSV file here or click to upload</p>
      </CsvDropzone>
      <AustralianGenomicsDacDialog
        showing={showingRedcapDialog}
        cancelShowing={cancelShowing}
        dacId={dacId}
        possibleApplications={possibleApplications}
        initialError={parseError}
      />
    </>
  );
};
