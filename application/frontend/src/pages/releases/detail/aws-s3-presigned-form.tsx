import React from "react";
import { useForm } from "react-hook-form";
import { ReleaseRemsSyncRequestType } from "@umccr/elsa-types";
import { ReleaseTypeLocal } from "./shared-types";

type Props = {
  releaseId: string;
  releaseData: ReleaseTypeLocal;
};

/**
 * A form that is used to ask for AWS S3
 * presigned URLS.
 *
 * @param releaseId
 * @constructor
 */
export const AwsS3PresignedForm: React.FC<Props> = ({
  releaseId,
  releaseData,
}) => {
  const displayPassword = releaseData.downloadPassword ?? "(ask PI)";

  return (
    <>
      {/* we use a POST form action here (rather than a onSubmit handler) because
            form POSTS can be converted natively into a browser file save dialog
             i.e. if the POST returned a Content-Disposition header */}
      <form
        action={`/api/releases/${releaseId}/aws-s3-presigned`}
        method="POST"
      >
        <div className="flex flex-col gap-6">
          <article className="prose">
            <p>
              Data files can be accessed through the use of AWS S3 presigned
              URLs. A TSV file containing file identifiers, URLs and other data
              will be prepared and available for download as a password
              protected zip file.
            </p>
            <p>
              The password for the zip file is controlled by the PI of this
              release. Given the presigned URLs can be used by anyone -
              possession of the zip file *and* password is equivalent to
              possession of the data itself.
            </p>
            <p>
              Presigned URLs are only useable for seven (7) days from the time
              of download.
            </p>
            <p>
              FOR DEMO:{" "}
              <a
                href="https://products.aspose.app/cells/viewer"
                target="_blank"
              >
                TSV Viewer
              </a>
            </p>
          </article>
          <label className="prose">
            <span className="text-xs font-bold text-gray-700 uppercase">
              Current Password
            </span>
            <input
              type="text"
              disabled={true}
              required={false}
              defaultValue={displayPassword}
              className="mt-1 block w-full rounded-md bg-gray-50 border-transparent focus:border-gray-500 focus:bg-white focus:ring-0"
            />
          </label>
          <div className="prose">
            <input type="submit" className="btn-normal" value="Download Zip" />
          </div>
        </div>
      </form>
    </>
  );
};
