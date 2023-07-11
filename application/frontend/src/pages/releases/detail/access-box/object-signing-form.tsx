import React, { useState } from "react";
import { CSRFInputToken } from "../../../../components/csrf-token";
import { TsvColumnCheck } from "../../../../components/access-box";
import { ReleaseTypeLocal } from "../../shared-types";
import { ObjectStoreRecordKey } from "@umccr/elsa-types/schemas";
import { Alert } from "../../../../components/alert";
import { trpc } from "../../../../helpers/trpc";
import { EagerErrorBoundary } from "../../../../components/errors";
import { SharerObjectSigningType } from "../../../../../../backend/src/config/config-schema-sharer";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
  objectSigningSetting: SharerObjectSigningType;
};

export const ObjectSigningForm: React.FC<Props> = ({
  releaseKey,
  releaseData,
}) => {
  const [isPrepareDownload, setIsPrepareDownload] = useState<boolean>(false);

  const getFilePasswordMutate = trpc.release.getReleasePassword.useMutation({});

  const [isPassInClipboard, setIsPassInClipboard] = useState<boolean>(false);

  return (
    <div className="prose">
      {getFilePasswordMutate.isError && (
        <EagerErrorBoundary error={getFilePasswordMutate.error} />
      )}
      {isPrepareDownload && (
        <Alert
          icon={<span className="loading loading-bars loading-xs" />}
          description={"Preparing ZIP file for download"}
          additionalAlertClassName={
            "alert alert-info bg-slate-300 text-md py-1 mb-3"
          }
        />
      )}
      <div className="flex w-full flex-col ">
        <div className="card rounded-box grid flex-grow">
          <article className="prose mb-5">
            <span className="text-lg font-bold">File Password</span>
            <p>
              The file will be encrypted with a password. Use the following box
              to view the password.
            </p>
          </article>
          <span className="flex w-full items-center">
            {getFilePasswordMutate.data ? (
              <textarea
                disabled
                className="input-bordered input !m-0 w-full overflow-hidden break-words"
              >
                {getFilePasswordMutate.data}
              </textarea>
            ) : (
              <input
                disabled
                type={"password"}
                className="input-bordered input !m-0 w-full break-words"
                value={"1234"}
              />
            )}

            {getFilePasswordMutate.isLoading ? (
              <span className="loading loading-spinner ml-4" />
            ) : getFilePasswordMutate.data ? (
              <button
                className="btn-table-action-navigate"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    getFilePasswordMutate.data!
                  );
                  setIsPassInClipboard(true);
                  setTimeout(() => {
                    setIsPassInClipboard(false);
                  }, 2000);
                }}
              >
                Copy
              </button>
            ) : (
              <button
                className="btn-table-action-navigate"
                onClick={() => {
                  getFilePasswordMutate.mutate({ releaseKey });
                }}
              >
                View
              </button>
            )}
          </span>

          <label className="label">
            <span className="label-text-alt h-4 text-red-600">
              {isPassInClipboard && "Password copied to clipboard"}
            </span>
          </label>
        </div>

        <form
          action={`/api/releases/${releaseKey}/tsv-manifest-archive`}
          method="POST"
        >
          <CSRFInputToken />
          <div className="flex flex-col gap-6">
            <article className="prose">
              <span className="text-lg font-bold">TSV Downloader Form</span>
              <p>
                This form allows you to download an encrypted zip file
                containing a TSV file. The TSV file contains one column holding
                signed object URLS - URLs that allow you to directly download
                the given genomic file.
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
                value={"Download Zip"}
                onClick={() => {
                  // Set loader alert
                  setIsPrepareDownload(true);
                  setTimeout(() => {
                    setIsPrepareDownload(false);
                  }, 3000);
                }}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
