import React, { useState } from "react";
import classNames from "classnames";
import { CSRFInputToken } from "../../../../components/csrf-token";
import { TsvColumnCheck } from "../../../../components/access-box";
import { ReleaseTypeLocal } from "../../shared-types";
import { ObjectStoreRecordKey } from "@umccr/elsa-types/schemas";
import { Alert } from "../../../../components/alert";

type Props = {
  releaseActivated: boolean;

  actionUrl: string;

  // note this is not so much a security thing, more a convenience thing.. I guess we could
  // deny access to these at the backend. But we don't particularly care if people download these
  // columns - we just don't think they need to see them in the UI
  fieldsToExclude: string[];
};

export const TsvDownloadDiv: React.FC<Props> = (props) => {
  const [isPrepareDownload, setIsPrepareDownload] = useState<boolean>(false);

  return (
    <>
      <form action={props.actionUrl} method="POST">
        <CSRFInputToken />

        <div className="flex flex-col gap-6">
          {isPrepareDownload && (
            <Alert
              icon={<span className="loading loading-bars loading-xs" />}
              description={"Preparing manifest for download"}
              additionalAlertClassName={
                "alert alert-info bg-slate-300 text-md py-2"
              }
            />
          )}

          {/* possibly should rewrite this grid to better handle small devices... we really just want the button side by side the list of checkboxes */}
          <div className="grid grid-cols-3">
            <div className="flex flex-col gap-2">
              {ObjectStoreRecordKey.filter(
                (field) => !props.fieldsToExclude.includes(field)
              ).map((field, i) => (
                <TsvColumnCheck key={i} field={field} />
              ))}
            </div>

            <div>
              <input
                type="submit"
                disabled={!props.releaseActivated}
                className="btn-normal"
                value={"Download TSV"}
                title={
                  !props.releaseActivated ? "Release Must Be Active" : undefined
                }
                onClick={() => {
                  setIsPrepareDownload(true);
                  setTimeout(() => {
                    setIsPrepareDownload(false);
                  }, 3000);
                }}
              />
            </div>
          </div>
        </div>
      </form>
    </>
  );
};
