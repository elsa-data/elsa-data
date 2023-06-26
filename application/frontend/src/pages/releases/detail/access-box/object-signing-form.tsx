import React, { useState } from "react";
import { CSRFInputToken } from "../../../../components/csrf-token";
import { TsvColumnCheck } from "../../../../components/access-box";
import { ReleaseTypeLocal } from "../../shared-types";
import { ObjectStoreRecordKey } from "@umccr/elsa-types/schemas";
import { Alert } from "../../../../components/alert";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

export const ObjectSigningForm: React.FC<Props> = ({
  releaseKey,
  releaseData,
}) => {
  const [isSetPrepareDownload, setPrepareDownload] = useState<boolean>(false);

  return (
    <>
      {isSetPrepareDownload && (
        <Alert
          icon={<span className="loading loading-bars loading-xs" />}
          description={"Preparing signed ZIP file to download"}
          additionalAlertClassName={
            "alert alert-info bg-slate-300 text-md py-1 mb-3"
          }
        />
      )}
      <form
        action={`/api/releases/${releaseKey}/tsv-manifest-archive`}
        method="POST"
      >
        <CSRFInputToken />
        <div className="flex flex-col gap-6">
          <article className="prose">
            <p>
              This allows you to download an encrypted zip file containing a TSV
              file. The TSV file contains one column holding signed object URLS
              - URLs that allow you to directly download the given genomic file.
            </p>
          </article>

          {ObjectStoreRecordKey.map((field, i) => (
            <TsvColumnCheck key={i} field={field} />
          ))}

          <div className="prose">
            <input
              type="submit"
              disabled={!releaseData.activation}
              className="btn-normal mt-4"
              value={
                "Download Zip" +
                (!releaseData.activation ? " (Release Must Be Active)" : "")
              }
              onClick={() => {
                // Set loader alert
                setPrepareDownload(true);
                setTimeout(() => {
                  setPrepareDownload(false);
                }, 3000);
              }}
            />
          </div>
        </div>
      </form>
    </>
  );
};
