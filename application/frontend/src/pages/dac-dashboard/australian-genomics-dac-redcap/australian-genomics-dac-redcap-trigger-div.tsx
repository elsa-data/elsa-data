import React, { useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import { FileRejection } from "react-dropzone";
import { AustraliaGenomicsDacRedcap } from "@umccr/elsa-types";
import { AustralianGenomicsDacDialog } from "./australian-genomics-dac-dialog";
import { trpc } from "../../../helpers/trpc";
import { CsvDropzone, formatError } from "../../../components/csv-dropzone";

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
      setParseError(formatError(err));
      setShowingRedcapDialog(true);
    },
  });

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
    [detectQuery, dacId]
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
