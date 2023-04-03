import React from "react";
import { CSRFInputToken } from "../../../components/csrf-token";

type Props = {
  releaseKey: string;
  htsgetUrl: string;
};

/**
 * A form that displays details of accessing the data via htsget, assuming
 * that has been enabled.
 *
 * @param releaseKey
 * @param releaseData
 * @constructor
 */
export const HtsgetForm: React.FC<Props> = ({ releaseKey, htsgetUrl }) => {
  return (
    <>
      {/* we use a POST form action here (rather than a onSubmit handler) because
            form POSTS can be converted natively into a browser file save dialog
             i.e. if the POST returned a Content-Disposition header */}
      <form
        action={`/api/releases/${releaseKey}/htsget-manifest`}
        method="POST"
      >
        <CSRFInputToken />
        <div className="flex flex-col gap-6">
          <article className="prose">
            <p>
              Genomic data can be accessed through the use of the{" "}
              <code>htsget</code> protocol. A TSV file containing sample
              identifiers for reads or variants that you are allowed to access
              will be prepared and available for download.
            </p>
            <p>
              The <code>htsget</code> endpoint below will need to be presented
              with a valid authentication corresponding to this release.
            </p>
          </article>
          <label className="prose">
            <span className="text-xs font-bold uppercase text-gray-700">
              htsget Endpoint
            </span>
            <input
              type="text"
              disabled={true}
              required={false}
              defaultValue={htsgetUrl}
              className="mt-1 block w-full rounded-md border-transparent bg-gray-50 font-mono focus:border-gray-500 focus:bg-white focus:ring-0"
            />
          </label>
          <div className="prose">
            <input type="submit" className="btn-normal" value="Download TSV" />
          </div>
        </div>
      </form>
    </>
  );
};
